'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import CardContent from '@mui/material/CardContent';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import { useAuth } from '@/lib/auth/auth-context';
import { ForbiddenError } from '@/lib/errors/api-errors';

const signInSchema = z.object({
	identifier: z.string().min(1, 'Please enter your admin email or phone number').trim(),
	password: z.string().min(6, 'Password must be at least 6 characters')
});

type SignInFormData = z.infer<typeof signInSchema>;

export function SignInPage() {
	const { login } = useAuth();
	const router = useRouter();
	const [showPassword, setShowPassword] = useState(false);
	const [serverError, setServerError] = useState<string | null>(null);

	const {
		control,
		handleSubmit,
		formState: { errors, isSubmitting }
	} = useForm<SignInFormData>({
		resolver: zodResolver(signInSchema),
		defaultValues: {
			identifier: '',
			password: ''
		}
	});

	const onSubmit = async (data: SignInFormData) => {
		setServerError(null);
		try {
			await login(data.identifier, data.password);
			router.push('/dashboard');
		} catch (err) {
			if (err instanceof ForbiddenError) {
				router.push('/403');
				return;
			}

			setServerError(err instanceof Error ? err.message : 'Invalid credentials. Please verify and try again.');
		}
	};

	return (
		<div className="flex min-w-0 flex-1 flex-col items-center sm:flex-row sm:justify-center md:items-start md:justify-start">
			<Paper className="h-full w-full px-4 py-8 ltr:border-r rtl:border-l sm:h-auto sm:w-auto sm:rounded-xl sm:p-12 sm:shadow-sm md:flex md:h-full md:w-1/2 md:items-center md:justify-end md:rounded-none md:p-16 md:shadow-none">
				<CardContent className="mx-auto w-full max-w-88 sm:mx-0 sm:w-88">
					<div className="flex items-center space-x-3 mb-6">
						<div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-500 text-white font-bold text-xl shadow-md">
							S
						</div>
						<div>
							<Typography className="text-xl font-bold tracking-tight text-text-primary leading-tight">
								Shikkhok-AI
							</Typography>
							<Typography className="text-xs font-semibold text-primary-500 uppercase tracking-wider">
								Admin Console
							</Typography>
						</div>
					</div>

					<Typography className="text-3xl font-extrabold leading-tight tracking-tight text-text-primary">
						Sign in
					</Typography>
					<Typography className="mt-1 text-sm text-text-secondary">
						Enter your credentials to access the administrative control panel.
					</Typography>

					{serverError && (
						<Alert
							severity="error"
							className="mt-6 text-sm"
							variant="filled"
						>
							{serverError}
						</Alert>
					)}

					<form
						name="signInForm"
						noValidate
						className="mt-6 flex w-full flex-col justify-center"
						onSubmit={handleSubmit(onSubmit)}
					>
						<Controller
							name="identifier"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									className="mb-4"
									label="Email or Phone"
									autoFocus
									type="text"
									error={!!errors.identifier}
									helperText={errors.identifier?.message}
									variant="outlined"
									required
									fullWidth
									disabled={isSubmitting}
								/>
							)}
						/>

						<Controller
							name="password"
							control={control}
							render={({ field }) => (
								<TextField
									{...field}
									className="mb-6"
									label="Password"
									type={showPassword ? 'text' : 'password'}
									error={!!errors.password}
									helperText={errors.password?.message}
									variant="outlined"
									required
									fullWidth
									disabled={isSubmitting}
									InputProps={{
										endAdornment: (
											<InputAdornment position="end">
												<IconButton
													onClick={() => setShowPassword(!showPassword)}
													edge="end"
													aria-label="toggle password visibility"
												>
													<FuseSvgIcon size={20}>
														{showPassword
															? 'heroicons-solid:eye-slash'
															: 'heroicons-solid:eye'}
													</FuseSvgIcon>
												</IconButton>
											</InputAdornment>
										)
									}}
								/>
							)}
						/>

						<Button
							variant="contained"
							color="primary"
							className="w-full mt-2 min-h-11 font-semibold text-base shadow-md"
							aria-label="Sign in"
							disabled={isSubmitting}
							type="submit"
							size="large"
						>
							{isSubmitting ? (
								<CircularProgress
									size={24}
									color="inherit"
								/>
							) : (
								'Sign in'
							)}
						</Button>
					</form>
				</CardContent>
			</Paper>

			<Box
				className="relative hidden h-full flex-auto items-center justify-center overflow-hidden p-16 md:flex lg:px-28"
				sx={{ backgroundColor: 'primary.dark', color: 'primary.contrastText' }}
			>
				<div className="relative z-10 w-full max-w-2xl text-center md:text-left">
					<Typography className="text-5xl font-extrabold leading-tight text-white mb-4">
						Shikkhok-AI Administration
					</Typography>
					<Typography className="text-lg text-primary-100 font-normal leading-relaxed">
						Centralized platform management, student analytics, curriculum oversight, and automated
						assessment control.
					</Typography>
				</div>
			</Box>
		</div>
	);
}

export default SignInPage;
