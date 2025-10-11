import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";

const AdminDashboard = () => {
  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-2xl font-bold">Admin Dashboard</h1>
      <Card>
        <CardHeader>
          <CardTitle>Welcome, Admin!</CardTitle>
          <CardDescription>Here's an overview of your application.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is where the main admin content will go.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminDashboard;