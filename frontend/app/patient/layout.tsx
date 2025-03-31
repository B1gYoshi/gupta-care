"use client"
import Link from "next/link";
import { ReactNode } from "react";
import { AppBar, Toolbar, Button, Box } from "@mui/material";
import { useRouter } from "next/navigation";

export default function PatientLayout({ children }: { children: ReactNode }) {

    const router = useRouter();
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
