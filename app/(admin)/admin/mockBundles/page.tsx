"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MockBundleTable } from "./MockBundleTable";
import { StatsCard } from "./StatsCard";
import { MockBundleFormDialog } from "./MockBundleFormModal";

export default function MockBundlesPage() {
  const [bundles, setBundles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedBundle, setSelectedBundle] = useState<any>(null);

  const fetchBundles = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/mockBundle");
      const data = await res.json();
      setBundles(data.bundles || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBundles();
  }, []);

  const handleEdit = (bundle: any) => {
    setSelectedBundle(bundle);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedBundle(null);
    setModalOpen(true);
  };

  const handleModalClose = () => {
    setModalOpen(false);
    setSelectedBundle(null);
    fetchBundles(); // Refresh list after create/edit
  };

  return (
    <div className="p-6 space-y-6">
      {/* Page Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <h1 className="text-3xl font-bold">Mock Bundles</h1>
        <Button onClick={handleCreate}>Create New Bundle</Button>
      </div>

      {/* Optional Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatsCard label="Total Bundles" value={bundles.length} />
        <StatsCard
          label="Published"
          value={bundles.filter((b) => b.status === "PUBLISHED").length}
        />
        <StatsCard
          label="Draft"
          value={bundles.filter((b) => b.status === "DRAFT").length}
        />
      </div>

      {/* Table */}
      <MockBundleTable
        bundles={bundles}
        loading={loading}
        onEdit={handleEdit}
        onRefresh={fetchBundles}
      />

      {/* Modal Form */}
      {modalOpen && (
        <MockBundleFormDialog
          open={modalOpen}
          onClose={handleModalClose}
          bundle={selectedBundle}
        />
      )}
    </div>
  );
}
