"use client"
import React, {useEffect, useState,} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useRouter } from "next/navigation";
import './login.css'

export default function Login() {
	const [alignment, setAlignment] = useState<string | null>('patient');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);
	const router = useRouter();

	const handleAlignment = (
		event: React.MouseEvent<HTMLElement>,
		newAlignment: string | null,
	) => {
		setAlignment(newAlignment);
	};

	useEffect(() => {
		setAlignment("patient")
		setEmailError (email.length === 0);
		setPasswordError (password.length === 0);
	}, [email, password, alignment])

	const handleSubmit = async (event: any) => {
		event.preventDefault();
		console.log(alignment)
		// only submit if email and password field are filled
		if (email.length > 0 && password.length > 0) {
			
			try {
				const resp = await fetch('/api/login', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						email: email,
						password: password,
					  }),
				})

				if (!resp.ok) {
					const errorData = await resp.json();
					console.error("Login failed:", errorData.message);
					return;
				  }
			
				  const data = await resp.json();

				  if (data.role === "patient") {
					router.push("/patient/home");
				  } else if (data.role === "clinician") {
					router.push("/clinician/home");
				  }
			} catch (err) {
				console.log(err)
			}

			console.log('Login Successful');
			
		}
	};

    return <div className='parent'>
        <Box
        component="form"
        noValidate
        autoComplete="off"
        className='loginBox'
		onSubmit={handleSubmit}
        >
			<ToggleButtonGroup
				value={alignment}
				exclusive
				onChange={handleAlignment}
				aria-label="text alignment"
			>
				<ToggleButton value="patient">
					Patient
				</ToggleButton>
				<ToggleButton value="clinician">
					Clinician
				</ToggleButton>
			</ToggleButtonGroup>
			<TextField 
				required 
				id="outlined-email-input" 
				label="email" 
				variant="outlined" 
				onChange={(e) => setEmail(e.target.value)}
				helperText={emailError ? "Required" : ""}
          		error={emailError}
			/>

			<TextField
				id="outlined-password-input"
				required
				label="password"
				type="password"
				autoComplete="current-password"
				onChange={(e) => setPassword(e.target.value)}
				helperText={passwordError ? "Required" : ""}
          		error={passwordError}
			/>
			<button type="submit">
				Login
			</button>
        </Box>
			
    </div>
    
}
