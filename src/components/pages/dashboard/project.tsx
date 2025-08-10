"use client";

import { CometCard } from "@/components/ui/CometCard";
import { ProjectSearch } from "@/components/ui/ProjectSearch";
import React, { useState, useEffect, useMemo } from "react";

type Project = {
  id: string;
  title: string;
  description: string;
  status: string;
  finalReportUrl: string;
  coverImageUrl?: string | null;
  userId: string;
  createdAt: string;
  imageSrc?: string;
  user?: User;
  username?: string;
};
type User = {
  id: string;
  name?: string | null;
  username: string;
};

export default function DashboardProjects() {
  // Sorting: default newest first (desc)
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [dateFilter, setDateFilter] = useState<"24h" | "month" | "year" | null>(null);
  const [searchWord, setSearchWord] = useState<string>("");

  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProjects() {
      try {
        setLoading(true);
        const res = await fetch("/api/projects");
        if (!res.ok) throw new Error("Failed to fetch projects");

        const data: Project[] = await res.json();
        const transformed = data.map((proj) => ({
          ...proj,
          imageSrc: proj.coverImageUrl || "",
          username: proj.user?.name || proj.user?.username || "User",
        }));

        setProjects(transformed);
        setError(null);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    fetchProjects();
  }, []);

  const filteredAndSortedProjects = useMemo(() => {
    let temp = [...projects];

    // search
    if (searchWord) {
      const q = searchWord.toLowerCase();
      temp = temp.filter((p) =>
        (p.title ?? "").toLowerCase().includes(q) ||
        (p.description ?? "").toLowerCase().includes(q) ||
        (p.username ?? "").toLowerCase().includes(q)
      );
    }

    // date filter
    if (dateFilter) {
      const now = new Date();
      temp = temp.filter((p) => {
        const d = new Date(p.createdAt);
        if (dateFilter === "24h") return now.getTime() - d.getTime() <= 24 * 60 * 60 * 1000;
        if (dateFilter === "month") return now.getTime() - d.getTime() <= 30 * 24 * 60 * 60 * 1000;
        if (dateFilter === "year") return now.getFullYear() === d.getFullYear();
        return true;
      });
    }

    // sort
    temp.sort((a, b) => {
      const aT = new Date(a.createdAt).getTime();
      const bT = new Date(b.createdAt).getTime();
      return sortOrder === "asc" ? aT - bT : bT - aT;
    });

    return temp;
  }, [projects, searchWord, dateFilter, sortOrder]);

  return (
    <div className="min-h-screen bg-[#0e0e0e] text-white flex items-start justify-between p-4 gap-4 w-full">
      <div className="flex-1 flex flex-col gap-6">
        <ProjectSearch
          onSearch={setSearchWord}
          onFilter={setDateFilter}
          onSort={setSortOrder}
        />

        {loading && <div className="text-center text-white py-10">Loading projects...</div>}
        {error && <div className="text-center text-red-500 py-10">{error}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 px-12 mb-28" dir="ltr">
          {!loading && !error && filteredAndSortedProjects.length === 0 ? (
            <div className="text-white text-center col-span-full text-2xl py-10 ">
              <span className="border p-2 rounded-xl border-green-600 text-gray-600 ">not found</span> !!
            </div>
          ) : (
            filteredAndSortedProjects.map((project, index) => (
              <CometCard
                id={project.id}
                key={project.id || index}
                title={project.title}
                description={project.description}
                imageSrc={project.imageSrc || ""}
                username={project.username || ""}
                status={project.status}
                createdAt={project.createdAt}
                finalReportUrl={project.finalReportUrl}
                userId={project.userId}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
