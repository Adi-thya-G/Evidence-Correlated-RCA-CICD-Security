import { MdOutlineKeyboardArrowRight } from "react-icons/md";
import type { ClusterItem } from "../src/stores/Userootcausestore"

interface ClusterRowProps {
  cluster: ClusterItem;
  active: boolean;
  last: boolean;
  onSelect: (id: number) => void;
}

export function ClusterRow({ cluster, active, last, onSelect }: ClusterRowProps) {
 
  return (
    <div
      onClick={() => {
        onSelect(cluster.clusterId)
      }}
      className={`flex p-3 px-5 gap-3 border-gray-300 place-items-center cursor-pointer hover:bg-gray-50
        ${last ? "" : "border-b"} ${active ? "bg-gray-50" : ""}`}
    >
      <div className="h-12 w-12 shrink-0 rounded-full text-white bg-red-700 text-center font-mono text-[14px] place-content-center">
        {cluster.confidence}%
      </div>

      <div className="flex flex-col flex-1 min-w-0">
        <h2 className="text-sm font-serif font-semibold truncate">{cluster.title}</h2>
        <h2 className="flex gap-3 text-gray-500 font-medium">
          <span className="text-[12px]">{cluster.findings_count} findings</span>
          <span className="text-[12px] truncate">{cluster.file_path}</span>
        </h2>
      </div>

      <div className="justify-center place-items-center gap-2 grid grid-cols-3">
        {cluster.tools?.slice(0, 3).map((tool) => (
          <div
            key={tool}
            className="bg-mauve-100 text-gray-800 text-[11px] px-2 p-1 border border-gray-300 rounded-sm"
          >
            {tool}
          </div>
        ))}
      </div>

      <div className="h-full flex justify-center place-items-center mr-0">
        <MdOutlineKeyboardArrowRight />
      </div>
    </div>
  );
}