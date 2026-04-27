import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET() {
    const session = await getServerSession(authOptions);
        if (!session) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    } else {

        const today = new Date();
        console.log(`after:${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`)
        const emailList = await fetch(
            "https://gmail.googleapis.com/gmail/v1/users/me/messages?" +
                new URLSearchParams({
                    maxResults: "10",
                    q: `after:${today.getFullYear()}/${today.getMonth() + 1}/${today.getDate()}`,
                }),
                {
                    headers: {
                        Authorization: `Bearer ${session.accessToken}`,
                    },
                });

        const emailData = await emailList.json();
        console.log(emailData)
        console.log(emailData.length)

        if (emailData.messages){ // check if there any emails
            console.log("emails found")
            const emailIDS = emailData.messages.map((email : any) => email.id);            

            const allEmails = await Promise.all(
                emailIDS.map(async (emailId: any) => {
                    const res = await fetch(
                        "https://gmail.googleapis.com/gmail/v1/users/me/messages/" + emailId + "?" + 
                            new URLSearchParams([
                                ["format", "metadata"],
                                ["metadataHeaders", "Subject"],
                                ["metadataHeaders", "From"],
                            ]),
                            {
                                headers: {
                                    Authorization: `Bearer ${session.accessToken}`,
                                }
                            }
                )
                const data = await res.json();
                return data;
                })
            )

            console.log(allEmails);
            return NextResponse.json(allEmails);

        } else {
            console.log("no emails")
            return NextResponse.json([])
        }
    }
}