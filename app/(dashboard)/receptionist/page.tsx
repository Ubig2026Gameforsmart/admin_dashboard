import { fetchCompetitions } from "./actions";
import { ReceptionistTable } from "./receptionist-table";

export default async function ReceptionistPage() {
  const { data, error } = await fetchCompetitions();

  return <ReceptionistTable initialData={data} initialError={error} />;
}
