"use client"
import Link from "next/link";
import { ReactNode, useEffect } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import { responseCookiesToRequestCookies } from "next/dist/server/web/spec-extension/adapters/request-cookies";

export default function PatientLayout({ children }: { children: ReactNode }) {
    const router = useRouter();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await fetch('/api/me', {
                    method: 'GET',
                    credentials: 'include',
                });
                
                if (!resp.ok) {

                    if (resp.status === 401) {
                        router.push("/login")
                    }

                    console.log("Bad response: " + resp.statusText)
                    throw new Error;
                }

                const data = await resp.json();

                if (data.role !== "patient") {
                    router.push("/clinician/home")
                }

                console.log(data)
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchData();
    }, []);

    
    return (
        <div>
        
        <AppBar position="static" sx={{ backgroundColor: "transparent", boxShadow: "none", color:"black"}}>
            <Toolbar>
                
                <Box sx={{ flexGrow: 1 }} />
                
                <Button color="inherit" onClick={() => router.push("/patient/home")}>
                    Home
                </Button>
                <Button color="inherit" onClick={() => router.push("/patient/prescriptions")}>
                    Prescriptions
                </Button>
                <Button color="inherit" onClick={() => router.push("/patient/records")}>
                    Records
                </Button>
                
            </Toolbar>
        </AppBar>

        
        <div>{children}</div>
        </div>
    );
}
