"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Spinner } from "@/components/ui/spinner";
import { CheckCircle2, RotateCcw } from "lucide-react";
import { PageShell } from "./page-shell";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type AssessmentLevel = "BEGINNER" | "ADVANCED";

export function SurveyLoading() {
  return (
    <PageShell>
      <Card className="rounded-xl">
        <CardContent className="flex items-center justify-center py-8">
          <Spinner className="size-6 text-primary" />
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function SurveyUnavailable({
  message,
  onReload,
}: {
  message: string;
  onReload: () => void;
}) {
  return (
    <PageShell>
      <Card className="rounded-xl">
        <CardHeader>
          <CardTitle>Survey is not available</CardTitle>
          <CardDescription>{message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button type="button" variant="outline" onClick={onReload}>
            <RotateCcw />
            Reload
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

export function SurveySubmitted({
  recommendedAssessmentLevel,
  selectedAssessmentLevel,
  choosingRoom,
  responseId,
  onChooseRoom,
  onSubmitRoomChoice,
}: {
  recommendedAssessmentLevel: AssessmentLevel | null;
  selectedAssessmentLevel: AssessmentLevel | null;
  averageScore: number | null;
  correctnessPercentage: number | null;
  choosingRoom: boolean;
  responseId: string;
  onChooseRoom: (assessmentLevel: AssessmentLevel) => void;
  onSubmitRoomChoice: () => Promise<void>;
}) {
  const recommendation = recommendedAssessmentLevel
    ? roomRecommendationByLevel[recommendedAssessmentLevel]
    : null;
  const selectedRoom = selectedAssessmentLevel
    ? roomRecommendationByLevel[selectedAssessmentLevel]
    : null;
  const changedFromRecommendation =
    Boolean(recommendedAssessmentLevel && selectedAssessmentLevel) &&
    recommendedAssessmentLevel !== selectedAssessmentLevel;

  return (
    <PageShell>
      <Card className="rounded-xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-lg bg-cloud-success-soft text-cloud-success">
              <CheckCircle2 className="size-5" />
            </span>
            <div>
              <CardTitle>Submission received</CardTitle>
              <CardDescription>
                {responseId ? `Response ID: ${responseId}` : "Thank you."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-4">
          {recommendation ? (
            <div className="grid gap-4 rounded-xl border border-primary/20 bg-primary/5 p-4">
              <div>
                <p className="text-xl font-semibold leading-8 text-cloud-heading">
                  {recommendation.title}
                </p>
                <p className="mt-2 text-sm leading-6 text-cloud-muted">
                  {recommendation.description}
                </p>
              </div>

              <div className="grid gap-3 border-t border-primary/10 pt-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-cloud-heading">
                      น้องอยากไปอยู่ห้องไหน?
                    </p>
                    <p className="text-xs text-cloud-muted">
                      คำแนะนำด้านบนอิงจากผลประเมินแรกสุด แต่น้องเลือกห้องที่อยากเรียนจริงได้
                    </p>
                  </div>
                  <RoomLessonsDialog />
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {roomChoiceOrder.map((level) => {
                    const room = roomRecommendationByLevel[level];
                    const selected = selectedAssessmentLevel === level;

                    return (
                      <Button
                        key={level}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        className="h-auto flex-col items-start gap-1 whitespace-normal px-4 py-3 text-left"
                        disabled={choosingRoom}
                        onClick={() => onChooseRoom(level)}
                      >
                        <span className="text-base font-semibold">
                          {room.choiceLabel}
                        </span>
                        <span
                          className={
                            selected
                              ? "text-xs text-primary-foreground/80"
                              : "text-xs text-muted-foreground"
                          }
                        >
                          {room.choiceDescription}
                        </span>
                      </Button>
                    );
                  })}
                </div>

                {selectedRoom ? (
                  <p className="text-xs text-cloud-muted">
                    ห้องที่เลือก:{" "}
                    <span className="font-semibold text-primary">
                      {selectedRoom.choiceLabel}
                    </span>
                    {changedFromRecommendation
                      ? " ระบบจะบันทึกห้องนี้เมื่อกด Submit & Back"
                      : " ตรงกับคำแนะนำจากผลประเมินแรกสุด"}
                  </p>
                ) : null}
              </div>
            </div>
          ) : null}
          <Button
            type="button"
            onClick={() => void onSubmitRoomChoice()}
            disabled={!selectedAssessmentLevel || choosingRoom}
          >
            {choosingRoom ? <Spinner /> : <RotateCcw />}
            Submit & Back
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}

function RoomLessonsDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          ดูบทเรียนแต่ละห้อง
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-lg">บทเรียนของแต่ละห้อง</DialogTitle>
          <DialogDescription className="leading-6">
            ใช้ข้อมูลนี้ช่วยตัดสินใจเลือกห้องที่เหมาะกับสิ่งที่น้องอยากเรียน
          </DialogDescription>
        </DialogHeader>
        <div className="max-h-[min(600px,calc(100dvh-12rem))] overflow-y-auto px-4 pb-4 scrollbar-none">
          <div className="">
            <Tabs defaultValue="BEGINNER">
              <TabsList className="bg-transparent">
                <TabsTrigger className="data-active:bg-primary data-active:text-white data-active:hover:text-white hover:text-primary" value="BEGINNER">Beginner</TabsTrigger>
                <TabsTrigger className="data-active:bg-primary data-active:text-white data-active:hover:text-white hover:text-primary" value="ADVANCED">Advance</TabsTrigger>
              </TabsList>
              {roomChoiceOrder.map((level) => {
                const room = roomRecommendationByLevel[level];
                return (
                  <TabsContent className="max-h-115" key={level} value={level}>
                    <div className="grid gap-2 border-b border-border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-heading text-xl font-semibold text-cloud-heading">
                          {room.choiceLabel}
                        </h3>
                        <p className="pt-1 text-xs font-medium text-primary">
                          {room.lessons.length} บทเรียน
                        </p>
                      </div>
                      <p className="text-sm leading-6 text-cloud-muted">
                        {room.choiceDescription}
                      </p>
                    </div>
                    <div className="border-b border-border bg-muted/30 px-4 py-3">
                      <p className="text-xs font-semibold text-primary">
                        เหมาะกับใคร
                      </p>
                      <p className="mt-1 text-sm leading-6 text-cloud-muted">
                        {room.lessonSummary}
                      </p>
                    </div>
                    <ol className="divide-y divide-border px-4 text-sm text-cloud-muted">
                      {room.lessons.map((lesson, index) => (
                        <li
                          key={lesson.title}
                          className="grid gap-2 py-3 sm:grid-cols-[2rem_1fr]"
                        >
                          <span className="text-xs font-semibold tabular-nums text-primary">
                            {String(index + 1).padStart(2, "0")}
                          </span>
                          <div className="grid gap-1">
                            <h4 className="font-semibold text-cloud-heading">
                              {lesson.title}
                            </h4>
                            <p className="leading-6">{lesson.description}</p>
                          </div>
                        </li>
                      ))}
                    </ol>
                  </TabsContent>
                )
              })}
            </Tabs>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const highlightedRoomClass =
  "font-bold text-primary decoration-primary/40 decoration-2 underline-offset-4";
const roomChoiceOrder = ["BEGINNER", "ADVANCED"] as const;

const roomRecommendationByLevel = {
  ADVANCED: {
    choiceLabel: "Advance",
    choiceDescription: "ต่อยอดไปโจทย์และแนวคิดที่ซับซ้อนขึ้น",
    lessonSummary: "เหมาะกับน้องที่มีพื้นฐานแล้วและอยากฝึกโจทย์ที่ท้าทายขึ้น",
    lessons: [
      { title: "Recap: Basic Programming", description: "ทบทวนพื้นฐานการเขียนโปรแกรม เช่น ตัวแปร ชนิดข้อมูล เงื่อนไข และลูปเบื้องต้น เพื่อเตรียมความพร้อมก่อนต่อยอดไปยังเนื้อหาที่ซับซ้อนขึ้น" },
      { title: "Nested loop", description: "เรียนรู้ลำดับขั้นตอนการทำงานแบบลูปซ้อนลูป ปูพื้นฐาน logic สำคัญสำหรับการเขียนโค้ดเพื่อแก้ปัญหา" },
      { title: "Array", description: "เรียนรู้โครงสร้างข้อมูลพื้นฐานสำหรับการจัดเก็บและเรียกใช้ชุดข้อมูลอย่างเป็นลำดับขั้น" },
      { title: "Function", description: "เรียนรู้การลดความซ้ำซ้อนของการเขียนโปรแกรม ด้วยการเรียนรู้วิธีสร้างและเรียกใช้งาน Function เพื่อให้โค้ดเป็นระเบียบและง่ายต่อการดูแลรักษา" },
    ],
    title: (
      <>
        จากผลการประเมินเบื้องต้น พี่ๆ แนะนำให้น้องอยู่ห้อง{" "}
        <span className={highlightedRoomClass}>Advance</span>{" "}
        เพื่อให้ได้เรียนรู้เนื้อหาที่ท้าทายและเหมาะกับพื้นฐานของน้อง
      </>
    ),
    description:
      "ห้อง Advance จะพาน้องต่อยอดจากพื้นฐานไปสู่เนื้อหาที่ซับซ้อนขึ้น เช่น Nested loop, array และ function เพื่อเตรียมพร้อมสำหรับโจทย์ที่ท้าทายกว่าเดิม",
  },
  BEGINNER: {
    choiceLabel: "Beginner",
    choiceDescription: "ปูพื้นฐาน programming ให้แน่นและมั่นใจ",
    lessonSummary: "เหมาะกับน้องที่อยากเริ่มจากพื้นฐานและค่อยๆ ตามบทเรียนให้ทัน",
    lessons: [
      { title: "Programming / Algorithm คืออะไร", description: "เรียนรู้แนวคิดการแก้ปัญหาด้วยลำดับขั้นตอน (Algorithm) และการนำขั้นตอนเหล่านั้นมาเขียนเป็นโปรแกรม" },
      { title: "Flowchart เบื้องต้น", description: "เรียนรู้การใช้ผังงาน (Flowchart) เพื่อออกแบบและสื่อสารลำดับการทำงานของโปรแกรม" },
      { title: "โครงสร้างโปรแกรมภาษา C", description: "เรียนรู้ส่วนประกอบพื้นฐานของโปรแกรมภาษา C และหน้าที่ของแต่ละส่วนภายในโปรแกรม" },
      { title: "Variables / Data Types", description: "เรียนรู้การประกาศตัวแปรและชนิดข้อมูลพื้นฐานสำหรับจัดเก็บข้อมูลในโปรแกรม" },
      { title: "Printf / Scanf", description: "เรียนรู้การแสดงผลข้อมูลออกทางหน้าจอและการรับข้อมูลจากผู้ใช้งาน" },
      { title: "Operators", description: "เรียนรู้การใช้ตัวดำเนินการสำหรับคำนวณ เปรียบเทียบ และจัดการข้อมูลภายในโปรแกรม" },
      { title: "If-else", description: "เรียนรู้การกำหนดเงื่อนไขและการตัดสินใจเลือกแนวทางการทำงานของโปรแกรม" },
      { title: "Loops", description: "เรียนรู้การทำงานแบบวนซ้ำเพื่อให้โปรแกรมสามารถทำงานซ้ำได้อย่างมีประสิทธิภาพ" },
    ],
    title: (
      <>
        จากผลการประเมินเบื้องต้น พี่ๆ แนะนำให้น้องอยู่ห้อง{" "}
        <span className={highlightedRoomClass}>Beginner</span>{" "}
        เพื่อให้ได้เรียนรู้พื้นฐานอย่างเต็มที่และตามบทเรียนได้อย่างมั่นใจ
      </>
    ),
    description:
      "ห้อง Beginner จะเน้นสอน basic programming ตั้งแต่พื้นฐาน ค่อยๆ ปูแนวคิดสำคัญให้แน่น เพื่อให้น้องเขียนโปรแกรมได้มั่นใจขึ้นก่อนขยับไปเนื้อหาที่ยากกว่า",
  },
} as const;
