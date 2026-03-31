import SubastaView from "@/components/subasta/SubastaView";
import { useSubasta } from "@/features/subasta/useSubasta";

export default function SubastaPage() {
  const subasta = useSubasta();
  return <SubastaView {...subasta} />;
}
