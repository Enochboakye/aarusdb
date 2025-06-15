'use client';
import { useUser } from '@clerk/nextjs';

function CurrentUser() {
  const { user} = useUser();


  if (!user) {
    return <p>System User</p>;
  }

  return (
    <div>
      <p> {user.firstName} {user.lastName}!</p>
    </div>
  );
}

export default CurrentUser