import LogIn from "@/frontend/components/auth/login";

export default function Home() {
    return (
        <main className="flex-1 w-full min-h-[calc(100svh-100px)] flex items-center justify-center py-10">
            <LogIn />
        </main>
    );
}
