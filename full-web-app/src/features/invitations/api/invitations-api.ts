import type { ApiResponse } from "../../../types/api";
import { authenticatedRequest } from "../../auth/api/authenticated-request";
import type {
  CreateInvitationRequest,
  InvitationItem,
  RespondInvitationRequest,
} from "../types/invitation";

export function createInvitation(taskId: number, request: CreateInvitationRequest) {
  return authenticatedRequest<ApiResponse<InvitationItem>>(
    `/api/tasks/${taskId}/invitations`,
    {
      method: "POST",
      body: JSON.stringify(request),
    },
  );
}

export function getReceivedInvitations() {
  return authenticatedRequest<ApiResponse<InvitationItem[]>>("/api/invitations");
}

export function respondToInvitation(
  invitationId: number,
  request: RespondInvitationRequest,
) {
  return authenticatedRequest<ApiResponse<InvitationItem>>(
    `/api/invitations/${invitationId}`,
    {
      method: "PATCH",
      body: JSON.stringify(request),
    },
  );
}

export function cancelInvitation(invitationId: number) {
  return authenticatedRequest<void>(`/api/invitations/${invitationId}`, {
    method: "DELETE",
  });
}
