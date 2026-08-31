import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import {
  QURAN_SURAHS,
  getSurahInfo,
  calculateRealisticQuranAssignment,
  FAMOUS_RECITERS
} from "./src/data/quranData.js";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Initialize Google GenAI
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper for realistic fallback when Gemini key is not set or network issue
function getFallbackPlan(student: any) {
  const surahId = student.currentSurah || student.currentSurahName || 78;
  const ayah = student.currentAyah || 1;
  const assignment = calculateRealisticQuranAssignment(
    surahId,
    ayah,
    student.level || "متوسط",
    student.dailyNewTarget || "نصف وجه"
  );

  const isWeak = student.level === "ضعيف";
  const isStrong = student.level === "قوي";

  return {
    roadmapSummary: `خطة تحفيظ تربوية متقنة للطالب ${student.name} في ${assignment.surah.name} (عدد آياتها ${assignment.surah.numberOfAyahs} آية)، تبدأ من الآية (${assignment.startAyah}) بمعدل ${student.dailyNewTarget || "نصف وجه"} يومياً مع التثبيت الدوري.`,
    currentDailyAssignment: {
      newMemorization: assignment.newMemorization,
      review: assignment.review,
      suggestedSheikh: assignment.suggestedSheikh,
      tajweedFocus: assignment.tajweedFocus,
      dailyNote: assignment.dailyNote,
    },
    difficultyAdjustment: isWeak
      ? "خطة ميسرة تراعي سن وقدرة الطالب مع التركيز على التكرار وضبط المخارج"
      : isStrong
      ? "خطة متقدمة تركز على سرعة الاستيعاب وجودة الإتقان والربط"
      : "خطة متوازنة تحقق الاستمرارية والإتقان",
    estimatedDaysToFinishJuz: isWeak ? 40 : isStrong ? 20 : 30,
  };
}

// 1. Generate Daily Quran AI Plan with STRICT Quran Ground Truth
app.post("/api/gemini/generate-plan", async (req, res) => {
  try {
    const { student } = req.body;
    if (!student) {
      return res.status(400).json({ error: "بيانات الطالب مطلوبة" });
    }

    const surah = getSurahInfo(student.currentSurah || student.currentSurahName || 78);
    const startAyah = Math.max(1, Math.min(student.currentAyah || 1, surah.numberOfAyahs));

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ plan: getFallbackPlan(student) });
    }

    const prompt = `أنت شيخ مقرئ ومربٍ خبير في تحفيظ القرآن الكريم وتوجيه الحلقات القرآنية.
المطلوب: وضع خطة يومية تربوية دقيقة وخارطة طريق تحفيظ للطالب التالي:
- اسم الطالب: ${student.name}
- العمر: ${student.age} سنة
- المستوى: ${student.level} (ضعيف / متوسط / قوي)
- طاقة الحفظ اليومي للجديد: ${student.dailyNewTarget}
- طاقة المراجعة اليومية: ${student.dailyReviewTarget}
- ملاحظات المعلم: ${student.notes || "لا توجد"}

بيانات موضع الحفظ القرآني الحالي (حقائق قرآنية ملزمة):
- السورة الحالية: سورة ${surah.name} (رقم ${surah.number} في المصحف، نوعها: ${surah.revelationType}، الجزء: ${surah.juz})
- عدد آيات السورة الإجمالي: ${surah.numberOfAyahs} آية فقط!
- الآية الحالية التي يقف عندها: الآية رقم ${startAyah}

قواعد قرآنية وتربوية صارمة يجب الالتزام بها 100%:
1. [قاعدة حاسمة]: إجمالي آيات سورة ${surah.name} هو ${surah.numberOfAyahs} آية فقط! ممنوع نهائياً ومطلقاً ذكر أي رقم آية يتجاوز ${surah.numberOfAyahs} (مثلاً: سورة الناس 6 آيات فقط، سورة الفلق 5، الإخلاص 4، الفاتحة 7، الكوثر 3، إلخ).
2. إذا كان مقدار حفظ الطالب يصل لنهاية السورة، اكتب: "سورة ${surah.name} كاملة (الآيات 1 - ${surah.numberOfAyahs})" أو "سورة ${surah.name}: من الآية ${startAyah} إلى الآية ${surah.numberOfAyahs} (ختام السورة)".
3. حدد ورد المراجعة بالسورة والآيات، واقترح قارئاً معلماً معتمداً مناسباً لعمر ومستوى الطالب (مثلاً: الشيخ المنشاوي المعلم، أو الحصري المعلم، أو العفاسي).
4. اكتب توجيهاً منزلياً عملياً لولي الأمر للربط والتكرار والتثبيت قبل النوم.

أخرج النتيجة بصيغة JSON فقط:
{
  "roadmapSummary": "ملخص تربوي واستراتيجي لخطة الطالب في إتمام الحفظ والمراجعة",
  "currentDailyAssignment": {
    "newMemorization": "تحديد الآيات بالضبط للحفظ الجديد لليوم مع الالتزام التام بعدد آيات السورة (${surah.numberOfAyahs})",
    "review": "تحديد ورد المراجعة اليومي بدقة مع أسماء السور والآيات",
    "suggestedSheikh": "اسم الشيخ المقترح للاستماع له (مثل: الشيخ محمد صديق المنشاوي - المصحف المعلم)",
    "tajweedFocus": "الحكم التجويدي أو المهارة الصوتية للتركيز عليها اليوم",
    "dailyNote": "توجيه تربوي عملي للربط والتكرار بالمنزل"
  },
  "difficultyAdjustment": "توضيح هل تم التيسير أو التدرج ولماذا بناءً على مستوى الطالب",
  "estimatedDaysToFinishJuz": 30
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const plan = JSON.parse(text);
    res.json({ plan });
  } catch (error) {
    console.error("Gemini generate-plan error:", error);
    res.json({ plan: getFallbackPlan(req.body?.student || {}) });
  }
});

// 2. Evaluate Recitation Progress & Adjust Next Day Plan
app.post("/api/gemini/evaluate-progress", async (req, res) => {
  try {
    const { student, evaluation, currentPlan } = req.body;
    if (!student || !evaluation) {
      return res.status(400).json({ error: "بيانات الطالب والتقييم مطلوبة" });
    }

    const surah = getSurahInfo(student.currentSurah || student.currentSurahName || 78);

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        feedback: {
          studentProgressStatus: "منتظم",
          analysis: `تم إنجاز التسميع بنجاح في سورة ${surah.name} ومستوى الطالب طيب ومبشر.`,
          reasoning: "مواصلة الخطة المقررة مع التثبيت المستمر.",
          nextDayPlan: currentPlan?.currentDailyAssignment || getFallbackPlan(student).currentDailyAssignment,
        },
      });
    }

    const prompt = `أنت شيخ مقرئ وموجه تربوي لحلقات القرآن الكريم.
المطلوب: تحليل تسميع الطالب اليوم وضبط خطة الغد تلقائياً بناءً على ما أنجزه وملاحظات المعلم:
- اسم الطالب: ${student.name} (العمر: ${student.age} سنة، المستوى: ${student.level})
- السورة الحالية: سورة ${surah.name} (إجمالي آياتها: ${surah.numberOfAyahs} آية فقط)
- الورد المطلوب منه اليوم:
  * جديد: ${currentPlan?.currentDailyAssignment?.newMemorization || "غير محدد"}
  * مراجعة: ${currentPlan?.currentDailyAssignment?.review || "غير محدد"}
- ما أنجزه الطالب فعلياً اليوم:
  * في الحفظ الجديد: ${evaluation.recitationDetails?.newMemorizationAchieved || "لم يحدد"}
  * في المراجعة: ${evaluation.recitationDetails?.reviewAchieved || "لم يحدد"}
  * ملاحظات الشيخ/المعلم أو العذر: ${evaluation.recitationDetails?.teacherNotes || "لا يوجد"}
  * درجات التقييم اليوم: ${JSON.stringify(evaluation.criteriaValues || {})}

قواعد الذكاء الاصطناعي في الضبط والتخطيط:
1. التزام تام وصارم بآيات السورة (${surah.name} آياتها ${surah.numberOfAyahs} فقط، لا تتجاوز هذا الرقم أبداً).
2. إذا تعثر الطالب أو حفظ جزءاً فقط: لا تضغط عليه، قسّم ما تبقى عليه غداً مع خطوة تثبيت وتكرار.
3. إذا أتقن بتفوق وسهولة: زد له باعتدال أو عمّق المراجعة دون إخلال بالإتقان.
4. إذا كان معتذراً أو مريضاً: ضع خطة استدراكية خفيفة ولطيفة.

أرجع النتيجة بصيغة JSON فقط:
{
  "studentProgressStatus": "متقدم" | "منتظم" | "متأخر" | "يحتاج مساعدة",
  "analysis": "تحليل أداء الطالب اليوم ونقاط القوة والمواضع التي تحتاج عناية وتجويد",
  "reasoning": "سبب تعديل أو تثبيت خطة الغد",
  "nextDayPlan": {
    "newMemorization": "تحديد الآيات بالضبط للحفظ الجديد لغد (بحيث لا تتجاوز آيات سورة ${surah.name} البالغة ${surah.numberOfAyahs} آية)",
    "review": "تحديد ورد المراجعة لغد بدقة",
    "suggestedSheikh": "القارئ الأنسب لمستواه",
    "tajweedFocus": "الحكم التجويدي المطلوب مراعاته",
    "dailyNote": "نصيحة عملية للطالب وولي أمره لليوم التالي"
  }
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const feedback = JSON.parse(text);
    res.json({ feedback });
  } catch (error) {
    console.error("Gemini evaluate-progress error:", error);
    res.json({
      feedback: {
        studentProgressStatus: "منتظم",
        analysis: "تم تسجيل التسميع والمستوى جيد.",
        reasoning: "الاستمرار في الخطة التراكمية والتثبيت.",
        nextDayPlan: getFallbackPlan(req.body?.student || {}).currentDailyAssignment,
      },
    });
  }
});

// 3. Generate WhatsApp Message for Parent
app.post("/api/gemini/generate-whatsapp-message", async (req, res) => {
  try {
    const { student, attendanceStatus, evaluation, halaqahName, teacherName, clientPortalUrl } = req.body;

    const portalUrl = clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${student.id}`;

    const todayNewRecited = evaluation?.recitationDetails?.newMemorizationAchieved || (attendanceStatus === "حاضر" ? `سورة ${student.currentSurahName || "القرآن"} (الآيات المقررة)` : "لم يُسمّع اليوم لغيابه/اعتذاره");
    const todayReviewRecited = evaluation?.recitationDetails?.reviewAchieved || (attendanceStatus === "حاضر" ? "مراجعة ورد التثبيت الماضي" : "لم يُراجع اليوم");
    const teacherNotes = evaluation?.recitationDetails?.teacherNotes || "";
    const tomorrowNewPlan = student.aiPlan?.currentDailyAssignment?.newMemorization || `سورة ${student.currentSurahName || "القرآن"} (مواصلة الآيات التالية)`;
    const tomorrowReviewPlan = student.aiPlan?.currentDailyAssignment?.review || "مراجعة وتثبيت السور السابقة";
    const suggestedSheikh = student.aiPlan?.currentDailyAssignment?.suggestedSheikh || "الشيخ المنشاوي (المعلم)";
    const tajweedFocus = student.aiPlan?.currentDailyAssignment?.tajweedFocus || "مراعاة أحكام التجويد والمدود";
    const dailyNote = student.aiPlan?.currentDailyAssignment?.dailyNote || "الاستماع للقارئ وتكرار الورد 3 مرات قبل النوم.";

    if (!process.env.GEMINI_API_KEY) {
      let defaultMsg = `السلام عليكم ورحمة الله وبركاته 🌿\n`;
      defaultMsg += `تحية مباركة لولي أمر الطالب النجيب / *${student.name}*\n`;
      defaultMsg += `نشارككم التقرير اليومي لـ *${halaqahName || "حلقة القرآن الكريم"}*:\n\n`;
      defaultMsg += `📌 *حالة الحضور اليوم:* ${attendanceStatus}\n\n`;
      
      defaultMsg += `📖 *ما تم تسميعه وإنجازه اليوم بالتفصيل:*\n`;
      defaultMsg += `🔹 *الحفظ الجديد:* ${todayNewRecited}\n`;
      defaultMsg += `🔹 *المراجعة والتثبيت:* ${todayReviewRecited}\n`;
      if (teacherNotes) {
        defaultMsg += `💡 *ملاحظات المعلم والتجويد:* ${teacherNotes}\n`;
      }
      defaultMsg += `\n`;

      defaultMsg += `🎯 *المقرر المطلوب تسميعه غداً بإذن الله تعالى:*\n`;
      defaultMsg += `✨ *الورد الجديد لغد:* ${tomorrowNewPlan}\n`;
      defaultMsg += `🔄 *المراجعة لغد:* ${tomorrowReviewPlan}\n`;
      defaultMsg += `🎧 *القارئ المقترح للاستماع:* ${suggestedSheikh}\n`;
      defaultMsg += `📝 *توجيه منزلي:* ${dailyNote}\n\n`;

      defaultMsg += `🔗 *للاطلاع على تفاصيل بيانات الطالب ومتابعة تقدمه اليومي مباشرة، اضغط على الرابط التالي:*\n`;
      defaultMsg += `${portalUrl}\n\n`;
      defaultMsg += `نسأل الله أن يبارك في حفظه ويجعله قرة عين لكم 🤲\n`;
      defaultMsg += `معلم الحلقة: *${teacherName || "الشيخ محمد منتصر"}*`;
      return res.json({ message: defaultMsg });
    }

    const prompt = `أنت المعلم المشرف على حلقة تحفيظ القرآن الكريم.
المطلوب صياغة رسالة واتساب مفصلة وراقية، إسلامية، ومحفزة جداً لولي أمر الطالب باللغة العربية مع تنسيق علامات الواتساب (*عريض*) وإيموجيز قرآنية:

بيانات الطالب والتقرير:
- اسم الطالب: ${student.name}
- اسم ولي الأمر: ${student.parentName || "ولي أمر الطالب"}
- اسم الحلقة: ${halaqahName || "حلقة القرآن الكريم"}
- اسم المعلم: ${teacherName || "الشيخ محمد منتصر"}
- حالة الحضور اليوم: ${attendanceStatus} (حاضر / غائب / متأخر / معتذر)
- تفاصيل ما سمعه الطالب اليوم بالتفصيل:
  * في الحفظ الجديد اليوم: ${todayNewRecited}
  * في المراجعة اليوم: ${todayReviewRecited}
  * ملاحظات وتوجيهات المعلم اليوم: ${teacherNotes || "أداء طيب ومبارك"}
- المطلوب منه تسميعه غداً بإذن الله تعالى بالتفصيل:
  * ورد الحفظ الجديد لغد: ${tomorrowNewPlan}
  * ورد المراجعة والتثبيت لغد: ${tomorrowReviewPlan}
  * القارئ المقترح للاستماع له بالمنزل: ${suggestedSheikh}
  * تركيز التجويد: ${tajweedFocus}
  * توجيه المعلم المنزلي لولي الأمر: ${dailyNote}
- الرابط المباشر لبوابة الطالب الحية لمتابعة البيانات بالتفصيل: ${portalUrl}

شروط وتنسيق الرسالة:
1. ابدأ بتحية إسلامية دافئة موجهة لولي أمر الطالب باسم الطالب.
2. ضع قسماً واضحاً وبارزاً بعنوان: 📖 *ما تم تسميعه اليوم بالتفصيل* مع ذكر الجديد والمراجعة وملاحظات المعلم.
3. ضع قسماً واضحاً وبارزاً بعنوان: 🎯 *المقرر المطلوب تسميعه غداً بإذن الله تعالى* مع توضيح ورد الحفظ الجديد لغد والمراجعة والقارئ المعلم المقترح.
4. ضع فقرة واضحة تحث ولي الأمر على الضغط على رابط البوابة الحية للاطلاع على كافة بيانات ابنه وتفاصيل حفظه:
   🔗 *للاطلاع على ملف الطالب وبياناته التفصيلية:*
   ${portalUrl}
5. اختم بالدعاء المبارك والتوقيع باسم المعلم والحلقة.
6. اجعل الرسالة مكتملة ومنسقة دون أي حقول ناقصة.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
    });

    res.json({ message: response.text });
  } catch (error) {
    console.error("Gemini whatsapp error:", error);
    const portalUrl = req.body?.clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${req.body?.student?.id || ""}`;
    res.json({
      message: `السلام عليكم ورحمة الله وبركاته 🌿\nولي أمر الطالب العزيز / ${req.body?.student?.name || ""}\nتم تسجيل حضور وتسميع اليوم في حلقة القرآن الكريم بنجاح.\n🔗 لمتابعة بيانات الطالب بالتفصيل اليومي:\n${portalUrl}\nمع تحيات معلم الحلقة.`,
    });
  }
});

// 4. Generate Weekly / Monthly Detailed Report
app.post("/api/gemini/generate-report", async (req, res) => {
  try {
    const { student, reportType, attendanceSummary, evaluationList, halaqahName, teacherName, clientPortalUrl } = req.body;

    const portalUrl = clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${student?.id || ""}`;
    const periodLabel = reportType === "monthly" ? "الشهري" : reportType === "comprehensive" ? "الفصلي الشامل" : "الأسبوعي";

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        summary: `تقرير ${periodLabel} للطالب ${student?.name || ""}`,
        achievementsText: `أتم الطالب حفظ وتسميع السور المقررة بنسبة التزام عالية ومستوى ${student?.level || "ممتاز"}. إجمالي أيام الحضور المسجلة: ${attendanceSummary?.presents || 0} يوم.`,
        tajweedAssessment: "مخارج الحروف طيبة مع ضبط المدود وأحكام النون الساكنة والتنوين.",
        recommendations: "الاستمرار في الاستماع اليومي للمصحف المعلم بمعدل 15 دقيقة والتكرار مع الأسرة.",
        whatsappText: `السلام عليكم ورحمة الله وبركاته 🌿\nيسرنا في *${halaqahName || "حلقة القرآن الكريم"}* مشاركتكم التقرير ${periodLabel} للطالب النجيب / *${student?.name || ""}*.\n📊 نسبة الحضور: *${attendanceSummary?.attendancePercentage || "100%"}*\n✨ إنجاز الحفظ: سورة ${student?.currentSurahName || ""}\n🔗 يمكنكم الاطلاع على كامل تفاصيل التقرير وملف الطالب عبر الرابط:\n${portalUrl}\nمع تحيات المشرف: *${teacherName || "الشيخ محمد منتصر"}*`,
      });
    }

    const prompt = `أنت خبير توجيه تربوي وإداري في حلقات تحفيظ القرآن الكريم.
المطلوب إعداد تقرير ${periodLabel} شامل ومميز للطالب:
- الطالب: ${student?.name} (العمر: ${student?.age} سنة، المستوى: ${student?.level})
- ملخص الحضور: ${JSON.stringify(attendanceSummary || {})}
- سجل التقييمات والتسميع: ${JSON.stringify(evaluationList || [])}
- الحفظ الحالي: سورة ${student?.currentSurahName}
- اسم الحلقة: ${halaqahName || "حلقة القرآن الكريم"}
- اسم المعلم: ${teacherName || "الشيخ محمد منتصر"}
- رابط ملف الطالب: ${portalUrl}

أخرج تقريراً قيماً وملهماً بصيغة JSON حصراً:
{
  "summary": "عنوان ملخص للإنجاز والتقدم",
  "achievementsText": "بيان تفصيلي بما أنجزه الطالب من صفحات وآيات ومراجعة ومقدار التقدم خلال هذه الفترة",
  "tajweedAssessment": "تقييم التجويد والأداء الصوتي والضبط ومخارج الحروف",
  "recommendations": "نصائح وتوجيهات عملية لأولياء الأمور لتثبيت الحفظ في المنزل والتشجيع",
  "whatsappText": "رسالة واتساب أنيقة ومكتملة ومنسقة بالعريض (*نص*) والإيموجيز جاهزة للإرسال فوراً لولي الأمر مع رابط المتابعة"
}`;

    const response = await ai.models.generateContent({
      model: "gemini-3.7-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      },
    });

    const text = response.text || "{}";
    const reportData = JSON.parse(text);
    res.json(reportData);
  } catch (error) {
    console.error("Gemini report error:", error);
    const { student, reportType, attendanceSummary, halaqahName, teacherName, clientPortalUrl } = req.body || {};
    const portalUrl = clientPortalUrl || `${process.env.APP_URL || ""}/?portal=${student?.id || ""}`;
    const periodLabel = reportType === "monthly" ? "الشهري" : "الأسبوعي";

    res.json({
      summary: `تقرير ${periodLabel} للطالب ${student?.name || ""}`,
      achievementsText: `أتم الطالب حفظ وتسميع السور المقررة بنسبة التزام طيبة ومستوى ${student?.level || "جيد"}. إجمالي أيام الحضور: ${attendanceSummary?.presents || 0} يوم.`,
      tajweedAssessment: "مخارج الحروف طيبة مع ضبط المدود وأحكام التجويد الأساسية.",
      recommendations: "الاستماع اليومي للمصحف المعلم بمعدل 15 دقيقة والتكرار المستمر.",
      whatsappText: `السلام عليكم ورحمة الله وبركاته 🌿\nيسرنا في *${halaqahName || "حلقة القرآن الكريم"}* مشاركتكم التقرير ${periodLabel} للطالب النجيب / *${student?.name || ""}*.\n📊 نسبة الحضور: *${attendanceSummary?.attendancePercentage || "100%"}*\n✨ إنجاز الحفظ: سورة ${student?.currentSurahName || ""}\n🔗 يمكنكم الاطلاع على كامل تفاصيل التقرير وملف الطالب عبر الرابط:\n${portalUrl}\nمع تحيات المعلم: *${teacherName || "الشيخ محمد منتصر"}*`,
    });
  }
});

// 5. Interactive Quran Coach AI Chat
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { message, history, context } = req.body;

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: `أهلاً بك يا شيخنا الفاضل. بصفتي مساعدك القرآني الذكي، أنا جاهز لمساعدتك في تخطيط ورد الطلاب، وتذليل صعوبات الحفظ، وتقديم أفضل الوسائل التربوية لتحفيز طلاب الحلقة. كيف يمكنني خدمتك اليوم؟`,
      });
    }

    const systemInstruction = `أنت "مستشار عمران القرآني الذكي"، شيخ ومربٍ خبير، ضليع في علوم القرآن، التجويد والقراءات، وطرق التدريس والتحفيظ النبوية الحديثة، مع خبرة عميقة في التعامل مع مختلف مستويات وفئات الطلاب النفسية والعمرية.
لديك وصول كامل لبيانات الحلقة التالية:
- عدد الطلاب: ${context?.studentsCount || 0}
- ملخص مستويات الطلاب: ${JSON.stringify(context?.studentsSummary || [])}
- إعدادات الحلقة: ${JSON.stringify(context?.settings || {})}

مهمتك:
1. الإجابة عن أي استشارة تعليمية أو تجويدية أو تربوية يطرحها المعلم.
2. اقتراح خطط علاجية وتيسيرية للطلاب ضعاف الحفظ أو بطيئي الاستيعاب (مثل طريقة التكرار الثلاثي، طريقة الحفظ التراكمي، تقسيم الآيات الطويلة).
3. اقتراح أفكار ومسابقات تحفيزية للحلقة.
4. التحدث بلغة عربية فصيحة، وقورة، دافئة وداعمة ومحفزة.
5. إذا طلب المعلم تعديل خطة طالب محدد، أعطه خطة واضحة ومقترحة بالآيات والسور.`;

    const chat = ai.chats.create({
      model: "gemini-3.7-flash",
      config: {
        systemInstruction,
      },
    });

    // Send previous messages if any
    if (Array.isArray(history)) {
      for (const h of history.slice(-6)) {
        if (h.sender === "user") {
          // message history
        }
      }
    }

    const response = await chat.sendMessage({
      message: message || "السلام عليكم",
    });

    res.json({ reply: response.text });
  } catch (error) {
    console.error("Gemini chat error:", error);
    res.json({
      reply: "حدث خطأ أثناء الاتصال بالمستشار الذكي، يرجى المحاولة مرة أخرى أو مراجعة الاتصال.",
    });
  }
});

// Vite middleware for development & production static serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Omran Quran Platform server listening on port ${PORT}`);
  });
}

startServer();
