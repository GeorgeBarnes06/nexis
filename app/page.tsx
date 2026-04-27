import Image from "next/image";
import { cookies } from "next/headers";


async function getEvents(){
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");

    const res = await fetch("http://localhost:3000/api/calendar/events", {
      cache: "no-store", 
      headers: {
        Cookie: cookieHeader,
      }
    });

    if (!res.ok){
      return [];
    } else {
      const data = await res.json();
      return data;
    }
}

async function getEmails() {
  const cookieStore = await cookies();
  const cookieHeader = cookieStore.getAll()
    .map(c => `${c.name}=${c.value}`)
    .join("; ");
  
    const res = await fetch("http://localhost:3000/api/gmail", {
      cache: "no-store", 
      headers: {
        Cookie: cookieHeader,
      }
    });

    if (!res.ok){ //unauth error
      return [];
    } else{
      const data = await res.json();
      return data;
    }
}

export default async function Home() {
  const events = await getEvents();
  const emails = await getEmails();
  console.log(emails)
  return (
    <main className="bg-[#1414140d]">
      <p className="text-lg flex justify-center">Hello George</p>
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-[#ffffff]" >
          <div className="flex flex-col outline aspect-square p-4 overflow-y-auto">
            <p className="font-bold mb-2">This Week</p>
            <ul className="space-y-2">
              {events.map((event: any) => (
                <li key={event.id} className="border-b pb-2">
                  <p className="font-semibold text-sm">{event.summary}</p>
                  <p className="text-xs text-gray-500">
                    {event.start?.dateTime
                      ? new Date(event.start.dateTime).toLocaleString("en-GB", {
                          weekday: "short",
                          day: "numeric",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                      : event.start?.date}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="bg-[#ffffff]">
          <div className="flex flex-col outline aspect-square p-4 overflow-y-auto">
            <p className="font-bold mb-2">Emails Today</p>
            <ul className="space-y-2">
              {emails.map((email: any) => {
                const subject = email.payload?.headers?.find((h: any) => h.name === "Subject")?.value ?? "(no subject)";
                const from = email.payload?.headers?.find((h: any) => h.name === "From")?.value ?? "Unknown";
                return (
                  <li key={email.id} className="border-b pb-2">
                    <p className="font-semibold text-sm truncate">{subject}</p>
                    <p className="text-xs text-gray-500 truncate">{from}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(parseInt(email.internalDate)).toLocaleString("en-GB", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>


        <div className="card3">
          <p className="flex items-center justify-center outline aspect-square">Card 3</p>
        </div>
      </div>
    </main>
  );
}
