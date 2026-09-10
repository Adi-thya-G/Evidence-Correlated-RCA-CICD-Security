import { useRepoStore } from "@/stores/repoStore";

const menu = [
  {
    label: "Repository name",
    key: "name",
  },
  {
    label: "Repository full name",
    key: "full_name",
  },
  {
    label: "Repository Visibility",
    key: "private",
  },
];

const General = () => {
  const defaultRepo = useRepoStore((s) => s.default);

  return (
    <div className="p-2 flex flex-col gap-5 w-full">

      <div className="w-110 flex flex-col gap-2">
        <h2 className="text-[16px] font-serif font-semibold">
          Repository
        </h2>

        <p className="text-[13px] text-gray-400 font-serif">
          Basic identity for this connected repo. Used across the
          dashboard, notifications, and the deployment gate.
        </p>
      </div>

      <div className="flex flex-col gap-2">

        <h2 className="font-serif font-semibold text-[16px]">
          Repository
        </h2>

        <div className="p-3 border border-gray-300 rounded-sm bg-mauve-50 flex flex-col gap-2">

          {menu.map((item) => (
            <div
              key={item.key}
              className="flex  gap-3 "
            >
              <span className="text-sm text-gray-600 max-w-70">
                {item.label}
              </span>
              <span>:</span>
              <span className="text-sm text-gray-900">
                
                {item.key === "private"
                  ? defaultRepo?.private
                    ? "Private"
                    : "Public"
                  : defaultRepo?.[item.key as "name" | "full_name"]}
              </span>
            </div>
          ))}

        </div>
      </div>
    </div>
  );
};

export default General;