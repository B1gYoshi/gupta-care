"use client"
import Link from "next/link";
import { ReactNode, useEffect, useState, createContext, useContext } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";
import "./patient.css"

export type PatientInfo = {
    user_id: number;
    username: string;
    full_name: string;
    email: string;
    role: string;
    created_at: string;
};

export const PatientContext = createContext<PatientInfo | null>(null);

export const usePatient = () => useContext(PatientContext);

export default function PatientLayout({ children }: { children: ReactNode }) {
    const [patient, setPatient] = useState<PatientInfo | null>(null);
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

                    if (resp.status === 401 || resp.status === 403) {
                        router.push("/login")
                    } 

                    console.log("Bad response: " + resp.statusText)
                    throw new Error;
                }

                const data = await resp.json();
                setName(data.full_name)
                if (data.role !== "patient") {
                    router.push("/clinician/home")
                }
                setPatient(data);
            } catch (err) {
                console.log(err);
            }
        };
    
        fetchData();
    }, []);

    const handleLogout = async () => {
        try {
          await fetch('/api/logout', {
            method: 'POST',
            credentials: 'include'
          });
          router.push('/login');
        } catch (err) {
          console.error('Logout failed', err);
        }
      };
      

    
    return (
        <PatientContext.Provider value={patient}>
            <div className="contentParent">
            
                <AppBar className="appBar" position="static" sx={{ backgroundColor: "transparent", boxShadow: "none", color:"black"}}>
                    <Toolbar>
                        {name && "Welcome " + name + "!"}
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
                        <Button color="inherit" onClick={handleLogout}>
                            Logout
                        </Button>

                    </Toolbar>
                </AppBar>
                
                <div className="contentChild">{children}</div>
            </div>
        </PatientContext.Provider>
    );
}
