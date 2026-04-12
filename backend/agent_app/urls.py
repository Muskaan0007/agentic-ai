from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from . import views

urlpatterns = [
    # Auth
    path("register/", views.RegisterView.as_view(), name="register"),
    path("login/", views.LoginView.as_view(), name="login"),
    path("logout/", views.LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Agent
    path("agent/", views.AgentView.as_view(), name="agent"),
    path("ask/", views.ask_ai, name="ask_ai"),

    # Documents
    path("upload/", views.DocumentUploadView.as_view(), name="upload"),
    path("admin/documents/", views.AdminDocumentUploadView.as_view(), name="admin_documents"),

    # Admin
    path("users/", views.UserManagementView.as_view(), name="users"),
]
