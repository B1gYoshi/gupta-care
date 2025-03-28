import * as React from 'react';
import Box from '@mui/material/Box';
import TextField from '@mui/material/TextField';
import './login.css'

export default function Login() {


    return <div className='parent'>
        <Box
        component="form"
        noValidate
        autoComplete="off"
        className='loginBox'
        >
			<TextField 
				required 
				id="outlined-email-input" 
				label="email" 
				variant="outlined" 
			/>

			<TextField
				id="outlined-password-input"
				required
				label="password"
				type="password"
				autoComplete="current-password"
			/>
			<button>
				Login
			</button>
        </Box>
			
    </div>
    
}
