"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuthStore } from "../../../store/authStore";
import Chatbot from "../../../components/Chatbot";

export default function ChatPage() {
  const { userId: paramUserId } = useParams();
  const router = useRouter();
  const { userId: authUserId, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || paramUserId !== authUserId) {
      router.push("/login");
    }
  }, [isAuthenticated, paramUserId, authUserId, router]);

  if (!isAuthenticated || paramUserId !== authUserId) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Chatbot />
    </div>
  );
}
