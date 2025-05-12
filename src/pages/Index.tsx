// src/pages/Index.tsx

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, MessageCircleQuestion } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import logo from "/logo.svg";

interface SearchEngine {
  name: string;
  icon: string;
}

interface PopularSearch {
  title: string;
  id: string;
}

function Index() {
  const navigate = useNavigate();

  const selectedSearchEngines = useState<string[]>([
    "PubMed",
    "Google Scholar",
    "Clinical trials",
    "Library",
  ]);

  const selectableEngines : SearchEngine[] = [
    { name: "PubMed", icon: "/pubmed.svg" },
    { name: "Google Scholar", icon: "/google-patents.svg" },
    { name: "Clinical trials", icon: "/clinical-trials.svg" },
    { name: "Library", icon: "" },
  ];

  const popularSearches : PopularSearch[] = [
    { title: "Do chemoresistant AML cells express IL1RAP?", id: "1" },
    { title: "Is IL1RAP expressed in CML and when was this first described?", id: "2" },
    { title: "Which markers are expressed on AML cells that have an NPM1-mutation?", id: "3" },
  ];

  return (
    <>
      <div className="container flex flex-col gap-8 items-center md:pt-40">
        <div className="items-center justify-center flex flex-col gap-4">
          <img src={logo} alt="Wayless" className="h-[72px] w-[72px]" />
          <h1 className="text-3xl font-semibold">Medical research made easy</h1>
        </div>

        <div className="flex flex-col gap-4 items-center w-full">
          <div className="border border-gray-300 rounded-lg p-4 flex flex-col w-[80%]">
            <Textarea
              placeholder="Start searching with any question you'd like"
              className="overflow-auto border-none shadow-none resize-none focus:ring-0 focus:ring-offset-0 focus-visible:ring-0 focus-visible:ring-offset-0 outline-none text-lg"
            />
            <div className="flex flex-row justify-between">
              <div></div>
              <Button className="bg-[#2D67F6] hover:bg-[#2d4bf6]">
                <ArrowRight />
              </Button>
            </div>
          </div>

          <div className="w-[80%] flex flex-row gap-2">
            {selectableEngines.map((engine) => (
              <Badge
                variant="outline"
                className={(selectedSearchEngines[0].includes(engine.name) ? "border border-[#2D67F6]" : "") + " cursor-pointer flex flex-row gap-2 items-center p-2"}
                key={engine.name}
                onClick={() => {
                  selectedSearchEngines[1](
                    selectedSearchEngines[0].includes(engine.name)
                      ? selectedSearchEngines[0].filter((name) => name !== engine.name)
                      : [...selectedSearchEngines[0], engine.name]
                  );
                }}
              >
                {engine.icon != "" && <img src={engine.icon} alt={engine.name} />}
                {engine.icon == "" && 
                  <span className="font-semibold text-gray-700">{engine.name}</span>
                }
              </Badge>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4 items-start w-[80%] pt-16">
          <h2 className="text-2xl font-semibold">Popular searches</h2>
          <div className="flex flex-col gap-4 w-full">
            {popularSearches.map((search) => (
              <div className="p-4 flex flex-row border border-gray-300 rounded-lg w-full justify-between items-center hover:cursor-pointer" onClick={() => {
                navigate(`/chat/${search.id}`);
              }}>
                <div className="items-center flex flex-row gap-4">
                  <div className="rounded-lg flex flex-row items-center gap-2">
                    <MessageCircleQuestion className="stroke-[#2D67F6] bg-[#2d66f623] rounded-md h-10 w-10 p-2" />
                  </div>
                  <span className="font-semibold ">{search.title}</span>
                </div>
                <ArrowRight className="stroke-[#2D67F6]" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

export default Index;