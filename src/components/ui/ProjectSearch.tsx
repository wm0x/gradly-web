"use client";

import React, { useEffect, useState } from "react";
import { FiCommand, FiSearch, FiPlus } from "react-icons/fi";
import { MdTrendingUp } from "react-icons/md";
import { AiOutlineHistory } from "react-icons/ai";
import { CommandMenu } from "./CommandMenu";
import * as Dialog from "@radix-ui/react-dialog";
import UploadProject from "./Upload-project";
import { CiCalendarDate } from "react-icons/ci";
import { DialogTitle } from "@radix-ui/react-dialog";
import { useSession } from "next-auth/react";
import { cn } from "@/lib/utils";

type FilterKey = "24h" | "month" | "year" | null;
type SortKey = "asc" | "desc";

type ProjectSearchProps = {
  onSearch: (word: string) => void;
  onFilter: (filter: FilterKey) => void;
  onSort: (order: SortKey) => void;

  // optional controls for external recent-search mgmt (kept backward-compatible)
  recentSearches?: string[];
  removeRecentSearch?: (search: string) => void;

  onEditClick?: () => void;
  onAddClick?: () => void;
  onFilterClick?: () => void;
};

export const ProjectSearch = ({
  onSearch,
  onFilter,
  onSort,
  recentSearches: recentFromProps,
  removeRecentSearch,
}: ProjectSearchProps) => {
  // use localStorage if parent didn’t pass a list
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [openAdd, setOpenAdd] = useState(false);
  const [word, setWord] = useState<string>("");

  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  useEffect(() => {
    if (recentFromProps && recentFromProps.length) {
      setRecentSearches(recentFromProps.slice(0, 5));
      return;
    }
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("recentSearches");
      setRecentSearches(saved ? JSON.parse(saved) : []);
    }
  }, [recentFromProps]);

  const persistRecents = (list: string[]) => {
    if (!recentFromProps && typeof window !== "undefined") {
      localStorage.setItem("recentSearches", JSON.stringify(list));
    }
  };

  const handleSearch = (val: string) => {
    onSearch(val);
    setWord(val);
    setOpen(false);

    // update recent searches (de-dup, max 5)
    setRecentSearches((prev) => {
      const updated = [val, ...prev.filter((x) => x !== val)].slice(0, 5);
      persistRecents(updated);
      return updated;
    });
  };

  const handleDeleteRecent = (val: string) => {
    if (removeRecentSearch) {
      removeRecentSearch(val);
    }
    setRecentSearches((prev) => {
      const filtered = prev.filter((x) => x !== val);
      persistRecents(filtered);
      return filtered;
    });
  };

  const applyFilter = (k: FilterKey) => {
    onFilter(k);
    setOpen(false);
  };

  const applySort = (dir: SortKey) => {
    onSort(dir);
    setOpen(false);
  };

  const commandGroups = [
    {
      heading: "Trending searches",
      items: [
        { icon: MdTrendingUp, label: "smart system", action: () => handleSearch("smart system") },
        { icon: MdTrendingUp, label: "web application", action: () => handleSearch("web application") },
        { icon: MdTrendingUp, label: "Ai project", action: () => handleSearch("Ai project") },
      ],
    },
    {
      heading: "Filter by Date",
      items: [
        { icon: CiCalendarDate, label: "Last 24 hours", action: () => applyFilter("24h") },
        { icon: CiCalendarDate, label: "This month", action: () => applyFilter("month") },
        { icon: CiCalendarDate, label: "This year", action: () => applyFilter("year") },
        // Sorting
        { icon: CiCalendarDate, label: "Sort by: Date Added (First → Last)", action: () => applySort("asc") },
        { icon: CiCalendarDate, label: "Sort by: Date Added (Last → First)", action: () => applySort("desc") },
        // Clear
        { icon: CiCalendarDate, label: "Clear filters", action: () => applyFilter(null) },
      ],
    },
    {
      heading: "Recent searches",
      items: recentSearches.map((s) => ({
        icon: AiOutlineHistory,
        label: s,
        action: () => handleSearch(s),
        deleteAction: () => handleDeleteRecent(s),
      })),
    },
  ];

  return (
    <div className="flex items-center gap-3">
      <div
        onClick={() => setOpen(true)}
        className="flex-1 mb-4 mt-4 relative rounded-lg flex items-center px-3 py-2 text-sm cursor-pointer hover:ring-2 hover:ring-[#4ade80] hover:shadow-[0_0_12px_3px_rgba(74,222,128,0.3)] transition-all duration-300 p-8 w-full bg-[#052e16]"
        aria-label="Open project search and filters"
      >
        <FiSearch className="ml-2 text-[#4ade80]" />

        <input
          type="text"
          placeholder={word || "Search projects by name or username. Filter & sort…"}
          readOnly
          className="w-full bg-transparent border border-transparent placeholder:text-[#ffffff] focus:outline-none cursor-pointer p-1.5 placeholder:truncate"
        />

        <span className="px-2 py-1 text-xs flex gap-1 items-center shadow bg-[#4ade80]/80 rounded-md absolute right-2 top-1/2 -translate-y-1/2 text-[#ffffff]">
          K <FiCommand className="w-4 h-4" />
        </span>
      </div>

      <div className="flex gap-2 mr-3">
        <Dialog.Root open={openAdd} onOpenChange={setOpenAdd}>
          <Dialog.Trigger asChild>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (!isLoggedIn) return;
                setOpenAdd(true);
              }}
              disabled={!isLoggedIn}
              className={cn(
                "p-2 border bg-white text-black rounded-md transition-colors flex justify-between",
                "hover:bg-green-700 hover:text-white",
                !isLoggedIn && "opacity-50 cursor-not-allowed"
              )}
              aria-label="Add project"
            >
              <FiPlus className="w-4 h-4 mr-4 my-auto text-green-600 font-bold" />
              Add project
            </button>
          </Dialog.Trigger>

          <Dialog.Portal>
            <Dialog.Overlay className="fixed inset-0 bg-black/50" />
            <Dialog.Content className="fixed left-1/2 top-1/2 w-[90%] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl bg-white p-4 shadow-lg">
              <DialogTitle />
              {session?.user?.id && <UploadProject userId={session.user.id} />}
              <button
                onClick={() => setOpenAdd(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-black"
              >
                ✕
              </button>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      </div>

      {/* Your CommandMenu must render these groups and support deleteAction */}
      <CommandMenu
        open={open}
        setOpen={setOpen}
        placeholder="What are you looking for?"
        commandGroups={commandGroups}
        onWordSearch={handleSearch}
      />
    </div>
  );
};
