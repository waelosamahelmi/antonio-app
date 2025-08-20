import { useState } from "react";
import { useSupabaseAuth } from "@/lib/supabase-auth-context";
import { useAndroid } from "@/lib/android-context";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Smartphone, Wifi, Bell } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useSupabaseAuth();
  const { 
    isAndroid, 
    hasNetworkPermission,
    requestNetworkPermission,
    requestNotificationPermission,
    requestBluetoothPermission
  } = useAndroid();
  const [, setLocation] = useLocation();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const { user, error } = await signIn(email, password);
      if (error) {
        setError(error.message || "Login failed");
        return;
      }
      if (user) {
        setLocation("/admin");
      }
    } catch (err) {
      setError("Invalid email or password");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePermissionRequest = async () => {
    await Promise.all([
      requestNetworkPermission(),
      requestNotificationPermission(),
      requestBluetoothPermission()
    ]);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <Card>
          <CardHeader className="text-center">
            <div className="flex items-center justify-center mb-4">
              <Smartphone className="h-8 w-8 text-orange-600 mr-2" />
              <CardTitle className="text-2xl">Pizzeria Antonio</CardTitle>
            </div>            {isAndroid && (
              <p className="text-sm text-muted-foreground">
                Kitchen Management System
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Network Status for Android Apps */}
            {isAndroid && (
              <div className="space-y-4">
                <h3 className="text-sm font-medium">System Status</h3>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4" />
                    <Label>Network Connection</Label>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    hasNetworkPermission ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {hasNetworkPermission ? 'Available' : 'No Permission'}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Bell className="h-4 w-4" />
                    <Label>Permissions</Label>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    hasNetworkPermission ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'
                  }`}>
                    {hasNetworkPermission ? 'Ready' : 'Pending'}
                  </span>
                </div>

                {!hasNetworkPermission && (
                  <Button 
                    onClick={handlePermissionRequest}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    <Smartphone className="w-4 h-4 mr-2" />
                    Enable Permissions
                  </Button>
                )}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@pizzeriaantonio.fi"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <Button 
                type="submit" 
                className="w-full bg-orange-600 hover:bg-orange-700"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign In"}
              </Button>
            </form>
          </CardContent>
        </Card>        {/* System Information for Android Apps */}
        {isAndroid && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Smartphone className="w-5 h-5" />
                App Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertDescription>
                  This is the native Android version of the antonio Kitchen Management System.
                  Make sure you have a stable internet connection for the best experience.
                </AlertDescription>
              </Alert>
              
              <div className="text-sm text-muted-foreground space-y-1">
                <p>• Real-time order notifications</p>
                <p>• Offline-capable interface</p>
                <p>• Native Android performance</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
