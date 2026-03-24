import { Building2, Brain, Wrench, User } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { Entity } from "@/lib/db/schema";

const typeConfig: Record<string, { icon: LucideIcon; color: string }> = {
  company: { icon: Building2, color: "text-cat-company bg-cat-company/15" },
  lab: { icon: Building2, color: "text-cat-research bg-cat-research/15" },
  model: { icon: Brain, color: "text-cat-model bg-cat-model/15" },
  tool: { icon: Wrench, color: "text-cat-tool bg-cat-tool/15" },
  person: { icon: User, color: "text-muted-foreground bg-muted/15" },
};

export default function TopEntities({ entities }: { entities: Entity[] }) {
  if (entities.length === 0) return null;

  return (
    <div className="bg-card border border-border-subtle rounded-lg">
      <div className="flex items-center gap-2 px-3.5 py-2.5 border-b border-border-subtle">
        <Building2 className="h-4 w-4 text-cat-company" />
        <h2 className="text-xs font-semibold text-foreground">Top Entities</h2>
        <span className="ml-auto text-[10px] text-muted">{entities.length}</span>
      </div>

      <div className="p-2 grid grid-cols-2 gap-1.5">
        {entities.map((entity) => {
          const cfg = typeConfig[entity.type] ?? typeConfig.company;
          const Icon = cfg.icon;
          return (
            <div
              key={entity.id}
              className="flex items-center gap-2 px-2.5 py-2 rounded-md hover:bg-card-hover transition-colors"
            >
              <div
                className={`h-7 w-7 rounded-md flex items-center justify-center shrink-0 ${cfg.color}`}
              >
                <Icon className="h-3.5 w-3.5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-foreground truncate">
                  {entity.name}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-muted capitalize">{entity.type}</span>
                  <span className="text-[10px] text-muted-foreground">
                    {entity.mentionCount ?? 0} mentions
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
