from django.http import JsonResponse
from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import UserProfile, CompanyDocument
from .agent.agent import run_agent
from .rag.rag_tool import add_documents


# ─── Simple GET endpoint (no auth) ──────────────────────────────────────────
def ask_ai(request):
    """GET /api/ask/?q=your+question"""
    query = request.GET.get("q", "").strip()
    if not query:
        return JsonResponse({"error": "Query parameter 'q' is required."}, status=400)
    answer = run_agent(query)
    return JsonResponse({"answer": answer})


# ─── Auth ────────────────────────────────────────────────────────────────────
class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        email = request.data.get("email")
        password = request.data.get("password")

        if not all([username, email, password]):
            return Response(
                {"error": "Username, email, and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        if User.objects.filter(username=username).exists():
            return Response(
                {"error": "Username already exists."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.create_user(username=username, email=email, password=password)
        UserProfile.objects.create(user=user, role="user")
        return Response({"message": "User registered successfully."}, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not all([username, password]):
            return Response(
                {"error": "Username and password are required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        user = User.objects.filter(username=username).first()
        if not user or not user.check_password(password):
            return Response({"error": "Invalid credentials."}, status=status.HTTP_401_UNAUTHORIZED)

        refresh = RefreshToken.for_user(user)
        return Response(
            {
                "refresh": str(refresh),
                "access": str(refresh.access_token),
                "user": {
                    "id": user.id,
                    "username": user.username,
                    "email": user.email,
                    "role": user.profile.role,
                },
            },
            status=status.HTTP_200_OK,
        )


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        return Response({"message": "Logged out successfully."}, status=status.HTTP_200_OK)


# ─── Agent ───────────────────────────────────────────────────────────────────
class AgentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        query = request.data.get("query", "").strip()
        if not query:
            return Response({"error": "Query is required."}, status=status.HTTP_400_BAD_REQUEST)

        session_id = str(request.user.id)
        answer = run_agent(query, session_id=session_id)
        return Response({"answer": answer}, status=status.HTTP_200_OK)


# ─── Document Upload ─────────────────────────────────────────────────────────
class DocumentUploadView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        text = request.data.get("text", "").strip()
        file = request.FILES.get("file")

        texts = []
        if text:
            texts.append(text)
        if file:
            try:
                content = file.read().decode("utf-8", errors="ignore")
                texts.append(content)
            except Exception as e:
                return Response({"error": f"File read error: {e}"}, status=status.HTTP_400_BAD_REQUEST)

        if not texts:
            return Response(
                {"error": "Provide 'text' body or upload a file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        import time
        ids = [f"doc_{int(time.time())}_{i}" for i in range(len(texts))]
        add_documents(texts, ids)
        return Response({"message": f"{len(texts)} document(s) added to knowledge base."}, status=status.HTTP_201_CREATED)


# ─── Admin Document Management ──────────────────────────────────────────────
class AdminDocumentUploadView(APIView):
    """Admin-only endpoint to upload and store company documents"""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        """Upload document (admin only)"""
        if request.user.profile.role != "admin":
            return Response(
                {"error": "Only admins can upload documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        title = request.data.get("title", "").strip()
        content = request.data.get("content", "").strip()
        file = request.FILES.get("file")

        if not title:
            return Response(
                {"error": "Document title is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if not content and not file:
            return Response(
                {"error": "Provide either 'content' or upload a file."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        if file:
            try:
                content = file.read().decode("utf-8", errors="ignore")
            except Exception as e:
                return Response(
                    {"error": f"File read error: {e}"},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        # Save to database
        doc = CompanyDocument.objects.create(
            title=title,
            content=content,
            uploaded_by=request.user,
        )

        # Add to RAG knowledge base
        add_documents([content], ids=[f"doc_{doc.id}_{doc.title.lower().replace(' ', '_')}"])

        return Response(
            {
                "message": "Document uploaded successfully.",
                "document": {
                    "id": doc.id,
                    "title": doc.title,
                    "created_at": doc.created_at,
                    "uploaded_by": doc.uploaded_by.username,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    def get(self, request):
        """Get all documents (admin only)"""
        if request.user.profile.role != "admin":
            return Response(
                {"error": "Only admins can view documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        documents = CompanyDocument.objects.all().values(
            "id", "title", "content", "uploaded_by__username", "created_at", "updated_at"
        )
        return Response(list(documents), status=status.HTTP_200_OK)

    def delete(self, request):
        """Delete a document (admin only)"""
        if request.user.profile.role != "admin":
            return Response(
                {"error": "Only admins can delete documents."},
                status=status.HTTP_403_FORBIDDEN,
            )

        doc_id = request.data.get("id")
        if not doc_id:
            return Response(
                {"error": "Document ID is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            doc = CompanyDocument.objects.get(id=doc_id)
            doc.delete()
            return Response(
                {"message": f"Document '{doc.title}' deleted successfully."},
                status=status.HTTP_200_OK,
            )
        except CompanyDocument.DoesNotExist:
            return Response(
                {"error": "Document not found."},
                status=status.HTTP_404_NOT_FOUND,
            )


# ─── User Management (admin only) ────────────────────────────────────────────
class UserManagementView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if request.user.profile.role != "admin":
            return Response({"error": "Only admins can access this endpoint."}, status=status.HTTP_403_FORBIDDEN)

        users_data = [
            {"id": u.id, "username": u.username, "email": u.email, "role": u.profile.role}
            for u in User.objects.all()
        ]
        return Response(users_data, status=status.HTTP_200_OK)
