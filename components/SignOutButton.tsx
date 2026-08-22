"use client";
import { signOut } from "next-auth/react";

export default function SignOutButton() {
    return (
        <button
            onClick={() => signOut({ callbackUrl: "/" })}
            className="px-3 py-1.5 rounded bg-gray-800 text-gray-200 hover:bg-gray-700"
        >
            Sign out
        </button>
    );
}