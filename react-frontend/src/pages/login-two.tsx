import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import useLogin from "@/hooks/useLogin";
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { get } from "@github/webauthn-json";


const Login = () => {
    const navigate = useNavigate();

    const { loginUser } = useLogin();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');



    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        const success = await loginUser(email, password);
        if (success) {
            navigate('/dashboard');
        }
    };


    async function signInWithPasskey({ autofill = false }) {
        const createOptionsResponse = await fetch("http://localhost:5001/api/passkeys/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ start: true, finish: false, credential: null }),
        });

        const { loginOptions } = await createOptionsResponse.json();

        if (autofill) loginOptions.mediation = "conditional";

        if (controller) controller.abort();
        controller = new AbortController();

        // Open "register passkey" dialog
        const options = await get(
            {
                mediation: "conditional",
                signal: controller.signal
            }
        );

        const response = await fetch("http://localhost:5001/api/passkeys/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: 'include',
            body: JSON.stringify({ start: false, finish: true, options }),
        });

        if (response.ok) {
            console.log("user logged in with passkey")
            navigate("/dashboard")
            return;
        }
    }

    useEffect(() => {
        signInWithPasskeyAutofill();
    }, []);

    async function signInWithPasskeyAutofill() {
        if (isConditionalMediationAvailable()) {
            try {
                await signInWithPasskey({ autofill: true });
            } catch (error) {
                console.error("Error during Passkey autofill attempt:", error);
            }
        }

    }

    function isConditionalMediationAvailable() {
        return typeof window !== "undefined" && 
               window.PublicKeyCredential?.isConditionalMediationAvailable?.();
    }

    return (
        <div className="w-screen h-screen flex items-center justify-center">
            <Card className="w-full max-w-lg">
                <CardHeader>
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription className="">Choose your preferred sign in method</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col">
                        <form onSubmit={handleSubmit}>
                            <div className="flex flex-col gap-y-2">
                                <Label>Email</Label>
                                <Input
                                    id="email"
                                    required
                                    name="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    autoComplete="email webauthn"
                                />
                                <Label>Password</Label>
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    autoComplete="current-password"
                                />
                            </div>
                            <Button type="submit" className="mt-4 w-full">Sign in with Email</Button>
                        </form>
                        <div className="relative mt-4">
                            <div className="absolute inset-0 flex items-center">
                                <span className="w-full border-t" />
                            </div>
                            <div className="relative flex justify-center text-xs uppercase">
                                <span className="bg-background px-2 text-muted-foreground">
                                    Or continue with
                                </span>
                            </div>
                        </div>
                        <Button className="mt-4 w-full" onClick={() => signInWithPasskey({autofill: false})}>Sign in with a Passkey</Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

export default Login;

