"use client"
import Link from "next/link";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import "./clinician.css"

export type ClinicianInfo = {
    user_id: number;
    username: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
};

export const ClinicianContext = createContext<ClinicianInfo | null>(null);

export const useClinician = () => useContext(ClinicianContext);

export default function PatientLayout({ children }: { children: ReactNode }) {
    const [clinician, setClinician] = useState<ClinicianInfo | null>(null);
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
                    if (resp.status === 401) {
                        router.push("/login")
                    }

                    console.log("Bad response: " + resp.statusText)
                    throw new Error;
                }

                const data = await resp.json();
                setName(data.full_name)
                if (data.role !== "clinician") {
                    router.push("/patient/home")
                }

                setClinician(data);
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchData();
    }, []);

    return (
        <ClinicianContext.Provider value={clinician}>
            <div className="contentParent">
            
                <AppBar className="appBar" position="static" sx={{ backgroundColor: "transparent", boxShadow: "none", color: "black" }}>
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

                
                <div className="contentChild">{children}</div>
            </div>
        </ClinicianContext.Provider>
    );
}
