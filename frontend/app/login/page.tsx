"use client"
import React, {useEffect, useState,} from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import { useRouter } from "next/navigation";
import './login.css'
import { Modal } from '@mui/material';

export default function Login() {
	const [alignment, setAlignment] = useState<string | null>('patient');
	const [email, setEmail] = useState('');
	const [password, setPassword] = useState('');
	const [emailError, setEmailError] = useState(false);
	const [passwordError, setPasswordError] = useState(false);
	const router = useRouter();

	const [retypeEmail, setRetypeEmail] = useState('');
	const [retypePassword, setRetypePassword] = useState('');
	const [retypeEmailError, setRetypeEmailError] = useState(false);
	const [retypePasswordError, setRetypePasswordError] = useState(false);

	const [signupModalOpen, setSignupModalOpen] = useState<boolean>(false);

	const handleClose = () => {
		setSignupModalOpen(false)
	}

	const handleAlignment = (
		event: React.MouseEvent<HTMLElement>,
		newAlignment: string | null,
	) => {
		setAlignment(newAlignment);
	};

	useEffect(() => {
		setEmailError (email.length === 0);
		setPasswordError (password.length === 0);
	}, [email, password])

	const handleSignup = async (event: any) => {
		event.preventDefault();
	
		const isEmailValid = email.length > 0;
		const isRetypeEmailValid = retypeEmail === email;
		const isPasswordValid = password.length > 0;
		const isRetypePasswordValid = retypePassword === password;
	
		setEmailError(!isEmailValid);
		setRetypeEmailError(!isRetypeEmailValid);
		setPasswordError(!isPasswordValid);
		setRetypePasswordError(!isRetypePasswordValid);
	
		if (isEmailValid && isRetypeEmailValid && isPasswordValid && isRetypePasswordValid) {
			try {
				const resp = await fetch('/api/signup', {
					method: 'POST',
					headers: {
						'Content-Type': 'application/json',
					},
					credentials: 'include',
					body: JSON.stringify({
						email,
						password,
						role: alignment,
					}),
				});
	
				if (!resp.ok) {
					const errorData = await resp.json();
					console.error("Signup failed:", errorData.message);
					return;
				}
	
				console.log("Signup successful");
				setSignupModalOpen(false);
	
			} catch (err) {
				console.error(err);
			}
		}
	};
	

	const handleLogin = async (event: any) => {
		console.log("logging in ")
		event.preventDefault();

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
		<div className='selectorBox'>
			<ToggleButtonGroup
				value={alignment}
				exclusive
				onChange={handleAlignment}
				aria-label="text alignment"
				className='toggle'
			>
				<ToggleButton value="patient">
					Patient
				</ToggleButton>
				<ToggleButton value="clinician">
					Clinician
				</ToggleButton>
			</ToggleButtonGroup>
			<Box sx={{ flexGrow: 1 }} />
		</div>
        <Box
        component="form"
        noValidate
        autoComplete="off"
        className='loginBox'
		onSubmit={handleLogin}
        >
			
			<TextField 
				required 
				id="outlined-email-input" 
				label="email" 
				variant="outlined"
				className='loginTextFields' 
				onChange={(e) => setEmail(e.target.value)}
				helperText={emailError ? "Required" : ""}
          		error={emailError}
			/>
			<Box className='spacer' />
			<TextField
				id="outlined-password-input"
				required
				label="password"
				type="password"
				className='loginTextFields'
				autoComplete="current-password"
				onChange={(e) => setPassword(e.target.value)}
				helperText={passwordError ? "Required" : ""}
          		error={passwordError}
			/>
			<Box className='spacer' />
			<button type='submit' className='submitButton'>
				Login
			</button>

			<button type='button' onClick={() => setSignupModalOpen(true)} className='submitButton' >
				Create a new account
			</button>
        </Box>

		<Modal open={signupModalOpen} onClose={handleClose}>
			<Box
			sx={{
				position: 'absolute',
				top: '50%',
				left: '50%',
				transform: 'translate(-50%, -50%)',
				bgcolor: 'background.paper',
				boxShadow: 24,
				p: 4,
				width: 400,
				borderRadius: 2,
			}}>
				<form>
					<TextField
						required
						data-testid="signup-email"
						label="email"
						variant="outlined"
						className="loginTextFields"
						onChange={(e) => setEmail(e.target.value)}
						helperText={emailError ? "Required" : ""}
						error={emailError}
					/>
					<Box className="spacer" />

					<TextField
						required
						data-testid="signup-retype-email"
						label="retype email"
						variant="outlined"
						className="loginTextFields"
						onChange={(e) => setRetypeEmail(e.target.value)}
						helperText={retypeEmailError ? "Emails must match" : ""}
						error={retypeEmailError}
					/>
					<Box className="spacer" />

					<TextField
						required
						data-testid="signup-password"
						label="password"
						type="password"
						variant="outlined"
						className="loginTextFields"
						onChange={(e) => setPassword(e.target.value)}
						helperText={passwordError ? "Required" : ""}
						error={passwordError}
					/>
					<Box className="spacer" />

					<TextField
						required
						data-testid="signup-retype-password"
						label="retype password"
						type="password"
						variant="outlined"
						className="loginTextFields"
						onChange={(e) => setRetypePassword(e.target.value)}
						helperText={retypePasswordError ? "Passwords must match" : ""}
						error={retypePasswordError}
					/>
					<Box className="spacer" />

					<ToggleButtonGroup
						value={alignment}
						exclusive
						onChange={(_, newValue) => {
						if (newValue !== null) setAlignment(newValue);
						}}
						className="roleToggle"
					>
						<ToggleButton value="patient">Patient</ToggleButton>
						<ToggleButton value="clinician">Clinician</ToggleButton>
					</ToggleButtonGroup>
					<Box className="spacer" />

					<button type="submit" onClick={handleSignup}>
						Sign Up
					</button>

				</form>
			</Box>
		</Modal>
			
    </div>
    
}
