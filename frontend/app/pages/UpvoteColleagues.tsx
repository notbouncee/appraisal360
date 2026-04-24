import AppLayout from "@/app/templates/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/molecules/card";
import AppreciationForm from "@/components/organisms/AppreciationForm";

const UpvoteColleagues = () => {
  return (
    <AppLayout>
      <div className="w-full">
        <h1 className="text-2xl font-bold text-foreground mb-6">Upvote Colleagues</h1>

        <Card>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <CardTitle className="text-lg">Appreciate a Colleague</CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Submit one appreciation and one upvote at a time.
                </p>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <AppreciationForm />
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default UpvoteColleagues;
