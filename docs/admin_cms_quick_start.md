# Admin CMS: Quick Start Guide

**Status:** ✅ Ready to Use!
**Access:** http://localhost:3001/admin/lessons

---

## 🎉 What You Can Do Now

### 1. View All Lessons
Navigate to: **http://localhost:3001/admin/lessons**

You'll see a table of all 7 lessons across both modules with:
- Lesson title and subtitle
- Module and course names
- Duration
- Edit buttons

### 2. Edit Any Lesson
Click "Edit" on any lesson to open the markdown editor.

### 3. Write/Edit Content
The editor has two tabs:
- **Write Tab:** Markdown editing
- **Preview Tab:** See how it will look to users

### 4. Save Changes
Click "Save Changes" and your content updates immediately!

---

## ✍️ Markdown Quick Reference

### Headings
```markdown
# Big Heading (H1)
## Medium Heading (H2)
### Small Heading (H3)
```

### Text Formatting
```markdown
**Bold text**
*Italic text*
**_Bold and italic_**
```

### Lists
```markdown
- Bullet point 1
- Bullet point 2
- Bullet point 3

1. Numbered item 1
2. Numbered item 2
3. Numbered item 3
```

### Quotes
```markdown
> This is a quote
> — Source or attribution
```

### Links
```markdown
[Link text](https://example.com)
```

### Horizontal Rule
```markdown
---
```

---

## 📝 Example Lesson for Brand New Users

Here's an example of how to write for someone who knows nothing about AA:

```markdown
# You Don't Have to Figure This Out Alone

If you're here, you might be wondering if you have a problem with alcohol. Or maybe you already know you do, and you're scared about what comes next.

That's okay. A lot of us felt exactly the same way.

## What This Place Is

This isn't a replacement for going to meetings or talking to a doctor. Think of it as a gentle introduction—a way to learn what recovery might look like, at your own pace, without pressure.

You don't have to commit to anything right now. You don't even have to decide if you're "an alcoholic." You just have to be curious enough to keep reading.

## What AA Actually Is

AA stands for Alcoholics Anonymous. It's a group of people who help each other stop drinking.

Here's what it's NOT:
- It's not religious (though some people find it spiritual)
- It's not therapy or treatment
- It's not a cult or organization with leaders
- Nobody gets paid
- There are no dues or fees

Here's what it IS:
- A group of people who meet regularly
- People share their experiences with drinking and recovery
- Everyone helps each other stay sober
- It's been around since 1935
- Millions of people have used it to stop drinking

## You Don't Have to Stop Drinking Forever

I know that sounds backwards, but hear me out.

The phrase you'll hear a lot is "one day at a time." That means you only have to not drink TODAY. Not tomorrow. Not next week. Just today.

For a lot of us, thinking about "forever" was too much. But 24 hours? Most of us could handle that.

> "We are not cured of alcoholism. What we really have is a daily reprieve contingent on the maintenance of our spiritual condition."
> — The Big Book (AA's main text), page 85

## What Happens Next?

Nothing has to happen. You can:
- Keep reading these lessons
- Find a meeting near you (we'll show you how)
- Just lurk and learn
- Come back when you're ready

There's no timeline. There's no test. There's just people who've been where you are, and we're here if you want help.
```

---

## 💡 Writing Tips for Newcomers

### 1. Assume Zero Knowledge
- Don't assume they know what AA is
- Define terms like "sponsor," "Big Book," "meeting"
- Explain why things work, not just what to do

### 2. Remove Pressure
- Avoid "you should" or "you must"
- Use "many of us found" or "you might try"
- Give permission to take their time

### 3. Acknowledge Fear
- New people are scared, confused, ashamed
- Normalize those feelings
- Share that you felt it too

### 4. Be Specific
Instead of: "Get to a meeting"
Write: "AA meetings happen every day, all over the world. Some are in person at churches or community centers. Some are online via Zoom. You can just listen—you don't have to talk."

### 5. One Concept Per Lesson
Don't try to explain everything at once. Focus on:
- Lesson 1: You're not alone
- Lesson 2: What AA is (basics)
- Lesson 3: One day at a time
- Lesson 4: Finding a meeting

### 6. Use Real Language
- "Drunk" is okay
- "Alcoholic" is okay
- Be honest about what drinking did to you
- Don't sanitize or minimize

---

## 🎨 Formatting Recommendations

### Use Headings to Break Up Text
Long blocks of text are intimidating. Use H2 (##) headings every 2-3 paragraphs.

### Use Lists
Lists are easier to scan than paragraphs. Use them for:
- Steps
- Options
- Examples

### Use Quotes Sparingly
Big Book quotes add authority, but don't overdo it. One per lesson is plenty.

### Keep Paragraphs Short
2-4 sentences max. White space makes content less scary.

---

## 🔄 Workflow

1. **Go to /admin/lessons**
2. **Click "Edit" on a lesson**
3. **Write your content in the "Write" tab**
4. **Switch to "Preview" tab to see how it looks**
5. **Click "Save Changes"**
6. **View the lesson live** at `/course/first-30-days/learn/...`

---

## 🛠️ Technical Notes

### Content is Stored in MongoDB
- Field: `content.body`
- Format: Markdown string
- Old lessons still use `blocks` array (backward compatible)

### Rendering
- Markdown → HTML using react-markdown
- Styled with MUI theme
- Responsive on mobile

### No Build Required
- Changes are immediate
- Just save and refresh the lesson page

---

## 📚 Next Steps

**Immediate:**
1. Edit Lesson 1 ("welcome") with richer content
2. Test the preview
3. Save and view it live
4. Repeat for other lessons

**Short Term:**
1. Rewrite all 7 lessons for total beginners
2. Add more lessons to Module A
3. Create Module C with new focus

**Future Enhancements:**
1. Image upload for lessons
2. Draft/publish workflow
3. Version history
4. WYSIWYG editor (instead of markdown)

---

## 🆘 Troubleshooting

**Q: My changes aren't showing up**
A: Hard refresh the browser (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

**Q: Markdown isn't rendering correctly**
A: Check the preview tab—if it looks wrong there, fix the markdown syntax

**Q: I want to add images**
A: For now, use external URLs. We'll add image upload later.

**Q: Can I still use the old block system?**
A: Yes! Lessons with `blocks` still work. You can keep both formats.

**Q: How do I get admin access?**
A: Your user (mike@aacompanion.com) has been set to `role: 'admin'`

---

## 🎯 Your Mission

**Rewrite the course content for someone who:**
- Doesn't know what AA is
- Is scared and confused
- Might not even be sure they're an alcoholic
- Needs gentle, clear, honest guidance
- Wants to understand before committing

**Use the CMS to create lessons that feel like:**
- A friend explaining something complex
- A warm introduction, not a lecture
- Permission to take their time
- Hope without pressure

---

**Ready to start editing? Go to: http://localhost:3001/admin/lessons** 🚀
