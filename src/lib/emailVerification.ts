import axios from "axios";
import type {
  SendVerificationRequest,
  SendVerificationResponse,
  ConfirmVerificationResponse,
} from "@/types/api";

// Use a bare axios client (not the auth-aware `api`) for the public confirm
// endpoint so it works even when the user is not logged in.
const publicClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api",
  headers: { "Content-Type": "application/json" },
});

export async function requestVerification(
  email: string,
  accessToken: string,
): Promise<SendVerificationResponse> {
  const body: SendVerificationRequest = { email };
  const { data } = await axios.post<SendVerificationResponse>(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/email-verification/send`,
    body,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  return data;
}

export async function confirmVerification(
  token: string,
): Promise<ConfirmVerificationResponse> {
  const { data } = await publicClient.get<ConfirmVerificationResponse>(
    "/email-verification/confirm",
    { params: { token } },
  );
  return data;
}

export async function unlinkPersonalEmail(
  accessToken: string,
): Promise<void> {
  await axios.delete(
    `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/email-verification`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
}
