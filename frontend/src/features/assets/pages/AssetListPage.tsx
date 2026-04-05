import { type PaginationState, type SortingState, functionalUpdate } from "@tanstack/react-table";
import { useMutation } from "@tanstack/react-query";
import { Link, useSearchParams } from "react-router-dom";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { exportAssetsCsv, exportAssetsXlsx } from "@/features/assets/api/assets";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/layout/page-header";
import { Panel } from "@/components/layout/panel";
import { SelectField } from "@/components/ui/select-field";
import { useLookupsBundle } from "@/features/lookups/hooks/useLookups";
import { AssetDataTable } from "@/features/assets/components/asset-data-table";
import { useAssets } from "@/features/assets/hooks/useAssets";

export function AssetListPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const search = searchParams.get("search") ?? "";
  const statusId = searchParams.get("status_id") ?? "";
  const categoryId = searchParams.get("category_id") ?? "";
  const locationId = searchParams.get("location_id") ?? "";
  const page = Number(searchParams.get("page") ?? "1");
  const pageSize = Number(searchParams.get("page_size") ?? "20");
  const sortByParam = searchParams.get("sort_by");
  const sortDirParam: "asc" | "desc" = searchParams.get("sort_dir") === "desc" ? "desc" : "asc";
  const sortBy: "asset_tag" | "name" | undefined =
    sortByParam === "asset_tag" || sortByParam === "name" ? sortByParam : undefined;
  const { statuses, categories, locations } = useLookupsBundle({
    statuses: true,
    categories: true,
    locations: true,
    departments: false,
    vendors: false,
    models: false,
    employees: false,
    users: false,
  });

  const listParams: {
    search: string;
    statusId?: number;
    categoryId?: number;
    locationId?: number;
    page: number;
    pageSize: number;
    sortBy?: "asset_tag" | "name";
    sortDir: "asc" | "desc";
  } = {
    search,
    ...(statusId ? { statusId: Number(statusId) } : {}),
    ...(categoryId ? { categoryId: Number(categoryId) } : {}),
    ...(locationId ? { locationId: Number(locationId) } : {}),
    page: Number.isFinite(page) && page > 0 ? page : 1,
    pageSize: Number.isFinite(pageSize) && pageSize > 0 ? pageSize : 20,
    ...(sortBy ? { sortBy } : {}),
    sortDir: sortDirParam,
  };

  const sorting: SortingState =
    sortBy
      ? [{ id: sortBy, desc: sortDirParam === "desc" }]
      : [{ id: "asset_tag", desc: false }];

  const pagination: PaginationState = {
    pageIndex: Math.max((listParams.page ?? 1) - 1, 0),
    pageSize: listParams.pageSize ?? 20,
  };

  const setFilterParam = (key: string, value: string) => {
    const next = new URLSearchParams(searchParams);
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.set("page", "1");
    setSearchParams(next, { replace: true });
  };
  const exportMutation = useMutation({
    mutationFn: () => exportAssetsCsv(listParams),
  });
  const exportExcelMutation = useMutation({
    mutationFn: () => exportAssetsXlsx(listParams),
  });
  const { data, isLoading, error } = useAssets(listParams);
  const totalItems = data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(totalItems / pagination.pageSize));

  return (
    <div className="grid gap-6">
      <PageHeader
        eyebrow="Inventario"
        title="Registro asset"
        description="Ricerca, filtra ed esporta il parco asset attuale."
        actions={(
          <>
            <Button
              type="button"
              variant="secondary"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
            >
              {exportMutation.isPending ? "Esportazione…" : "Esporta CSV"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => exportExcelMutation.mutate()}
              disabled={exportExcelMutation.isPending}
            >
              {exportExcelMutation.isPending ? "Esportazione…" : "Esporta Excel"}
            </Button>
            <Button asChild>
              <Link to="/assets/new">Nuovo asset</Link>
            </Button>
          </>
        )}
      />

      <Panel eyebrow="Filtri" title="Ricerca & segmentazione">
        <div className="flex items-center justify-end gap-3 text-sm">
          <Badge tone="neutral">
            {data?.total ?? 0} asset
          </Badge>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setSearchParams(new URLSearchParams({ page: "1", page_size: String(pagination.pageSize) }), {
                replace: true,
              });
            }}
          >
            Azzera filtri
          </Button>
        </div>
        <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div className="grid gap-2">
            <label
              htmlFor="asset-filter-search"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Ricerca
            </label>
            <Input
              id="asset-filter-search"
              name="asset-filter-search"
              placeholder="Cerca per tag o nome asset…"
              value={search}
              onChange={(event) => setFilterParam("search", event.target.value)}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="asset-filter-status"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Stato
            </label>
            <SelectField
              value={statusId}
              onValueChange={(value) => setFilterParam("status_id", value)}
              placeholder="Tutti gli stati"
              options={statuses.map((item) => ({ value: String(item.id), label: item.name }))}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="asset-filter-category"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Categoria
            </label>
            <SelectField
              value={categoryId}
              onValueChange={(value) => setFilterParam("category_id", value)}
              placeholder="Tutte le categorie"
              options={categories.map((item) => ({ value: String(item.id), label: item.name }))}
            />
          </div>
          <div className="grid gap-2">
            <label
              htmlFor="asset-filter-location"
              className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground"
            >
              Sede
            </label>
            <SelectField
              value={locationId}
              onValueChange={(value) => setFilterParam("location_id", value)}
              placeholder="Tutte le sedi"
              options={locations.map((item) => ({ value: String(item.id), label: item.name }))}
            />
          </div>
        </div>
      </Panel>

      <Panel eyebrow="Vista tabellare" title="Inventario corrente">
        <AssetDataTable
          data={data?.items ?? []}
          sorting={sorting}
          pagination={pagination}
          onSortingChange={(updater) => {
            const nextSorting = functionalUpdate(updater, sorting);
            const next = new URLSearchParams(searchParams);
            const primarySort = nextSorting[0];

            if (!primarySort || (primarySort.id !== "asset_tag" && primarySort.id !== "name")) {
              next.delete("sort_by");
              next.delete("sort_dir");
            } else {
              next.set("sort_by", primarySort.id);
              next.set("sort_dir", primarySort.desc ? "desc" : "asc");
            }
            next.set("page", "1");
            setSearchParams(next, { replace: true });
          }}
          onPaginationChange={(updater) => {
            const nextPagination = functionalUpdate(updater, pagination);
            const next = new URLSearchParams(searchParams);
            next.set("page", String(nextPagination.pageIndex + 1));
            next.set("page_size", String(nextPagination.pageSize));
            setSearchParams(next, { replace: true });
          }}
          isLoading={isLoading}
          errorMessage={error?.message ?? null}
          rowCount={totalItems}
          pageCount={pageCount}
        />
      </Panel>

      {(exportMutation.error || exportExcelMutation.error) && (
        <Alert variant="destructive">
          <AlertDescription>
            {exportMutation.error?.message || exportExcelMutation.error?.message}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}



