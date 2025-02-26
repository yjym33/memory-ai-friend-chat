// 'use client';

// import { useEffect } from 'react';
// import { useParams, useRouter } from 'next/navigation';
// import { useAuth } from '../../../contexts/AuthContext';
// import Chatbot from '../../../components/Chatbot';

// export default function ChatPage() {
//   const { userId: authUserId, isAuthenticated } = useAuth();
//   const params = useParams();
//   const router = useRouter();
//   const userId = params.userId as string;

//   useEffect(() => {
//     // 인증되지 않은 사용자나 다른 사용자의 채팅방에 접근하려는 경우
//     if (!isAuthenticated || userId !== authUserId) {
//       router.push('/login');
//     }
//   }, [isAuthenticated, userId, authUserId, router]);

//   if (!isAuthenticated || userId !== authUserId) {
//     return null;
//   }

//   return (
//     <div className="min-h-screen bg-gray-100">
//       <Chatbot />
//     </div>
//   );
// } 

'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '../../../store/authStore';
import Chatbot from '../../../components/Chatbot';

export default function ChatPage() {
  const { userId: paramUserId } = useParams();
  const router = useRouter();
  const { userId: authUserId, isAuthenticated } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated || paramUserId !== authUserId) {
      router.push('/login');
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