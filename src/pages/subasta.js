import SubastaView from "@/components/subasta/SubastaView";
import { useSubasta } from "@/features/subasta/useSubasta";
import { useRouter } from "next/router";

export default function SubastaPage() {
  const router = useRouter();
  const address = typeof router.query.address === "string" ? router.query.address : undefined;
  const deployBlock = typeof router.query.block === "string" ? Number(router.query.block) : 0;

  const subasta = useSubasta({
    contractAddress: address,
    deployBlock,
  });

  return <SubastaView {...subasta} />;
}
