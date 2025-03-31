"use client"
import Link from "next/link";
import { ReactNode, useEffect, useState } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";

export default function PatientLayout({ children }: { children: ReactNode }) {
    const [name, setName] = useState<string | null>(null);

    const router = useRouter();
    useEffect(() => {
        const fetchData = async () => {
            try {
                const resp = await fetch('/api/me', {
                    method: 'GET',
                    credentials: 'include',
                });
                
                if (!resp.ok) {
                    console.log("Bad response: " + resp.statusText)
                    throw new Error;
                }

                const data = await resp.json();
                setName(data.full_name)
                if (data.role !== "clinican") {
                    router.push("/patient/home")
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
        
        <AppBar position="static" sx={{ backgroundColor: "transparent", boxShadow: "none" }}>
            <Toolbar>
                {name && "Welcome " + name + "!"}
                <Box sx={{ flexGrow: 1 }} />
                
                <Button color="inherit" onClick={() => router.push("/clinician/home")}>
                Home
                </Button>
                <Button color="inherit" onClick={() => router.push("/clinician/patientSearch")}>
                Patient Search
                </Button>
            </Toolbar>
        </AppBar>

        
        <div>{children}</div>
        </div>
    );
}
