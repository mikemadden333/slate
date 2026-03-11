
Madden Education Advisory
/
big new move we gotta make with Slate. I need to move it from having Noble data to having demo data. that includes renaming the charter system from noble to Veritas Charter Schools and then renaming the schools, giving them new locations (which are still on the south and west sides of Chicag in our most dangerous and underserved neighborhoods. I'd like to go from 17 campuses to 10, with 1 downtown (near muchin), 4 across the south side and 4 on the west side - again - all in chicago's most dangerous and underserved communities. this is a big shift. how do we do it?

9:00 AM

Assessed migration scope, mapped Chicago neighborhoods, flagged timeline question
Assessed migration scope, mapped Chicago neighborhoods, flagged timeline question
Let me look at the repo structure before I say anything strategic, because the answer depends entirely on where the data lives.


Synthesized strategic framework for organizational restructuring initiative
Synthesized strategic framework for organizational restructuring initiative
No repo files uploaded, so I'm working from what I know about Slate's architecture. Here's the honest assessment.

What you're actually saying vs. what you think you're saying

You think this is a data migration. It isn't. It's a product legitimacy problem you've been deferring. Right now Slate is a Noble internal tool wearing a costume. "Veritas" is the costume becoming the identity. That's a different kind of work - it requires coherence, not just find-and-replace.

The broken assumption

You said 1 downtown + 4 south + 4 west = 10. That's 9. Decide now: is the 10th school another south side campus, another west side campus, or a second downtown location? This matters because the data has to be internally consistent across every module - Briefing, Scholar, Ledger, Grounds, all of it. One wrong count cascades.

What you're avoiding

Whether you have a demo scheduled that's forcing this, or whether you're polishing because there's no prospect yet. The answer changes the urgency and the acceptable level of completeness.

The execution plan

Do this in three phases. Do not skip phase one.

Phase 1 - Map before you move (2 hours)

Before touching a single file, run this in your local repo:

bash
grep -r "Noble" src/ --include="*.ts" --include="*.tsx" --include="*.json" -l
grep -r "Noble" src/ --include="*.ts" --include="*.tsx" --include="*.json" -c | sort -t: -k2 -rn
You need to know: how many files, how deep, whether school names are in a single data layer or scattered through components. If they're scattered, this is a week of work. If they're centralized in a /data directory, it's a day.

Phase 2 - Build the Veritas school list first, on paper

Here's a proposed 10-school structure. Push back on anything that doesn't feel right.

#	School Name	Neighborhood	Side
1	Veritas Collegiate Academy	Near West Loop (near Murchin/Loop)	Downtown
2	Veritas Englewood Prep	Englewood	South
3	Veritas Roseland Academy	Roseland	South
4	Veritas Woodlawn High School	Woodlawn	South
5	Veritas Auburn Gresham Prep	Auburn Gresham	South
6	Veritas Austin Academy	Austin	West
7	Veritas North Lawndale Prep	North Lawndale	West
8	Veritas Garfield Park High School	East Garfield Park	West
9	Veritas Humboldt Park Academy	Humboldt Park	West
10	Veritas Little Village Prep	Little Village	West
That gives you 1 / 4 / 5. If you want 1 / 4 / 4, drop one west and add a second south - Chatham or South Shore are solid.

Each school needs: name, address (real street, fictional school), grades served, enrollment figure, founding year, principal name. You need this before a single line of code changes. The data model has to be complete or the Briefing and Scholar modules will have holes a prospect will see immediately.

Phase 3 - Execute in this order

Create /src/data/schools.ts (or wherever your central data lives) with the full Veritas dataset - all 10 schools, complete
Update the network-level constants: name, logo reference, tagline, city, total enrollment
Run the grep replacement across all remaining Noble references - scripted, not manual
Go module by module and verify: Briefing, Scholar, Ledger, Grounds, Roster. Those are the five most data-dependent
Civic and Raise last - they're Noble-specific anyway and less likely to surface in a first demo
What to STOP

Stop treating the other modules as equally urgent. For a demo, you need Briefing and Scholar to be airtight. Ledger needs clean numbers. The rest can have placeholder data as long as it's Veritas-branded. Don't let perfect be the enemy of demoable.

Kill switch

If Phase 1 reveals that school data is hardcoded in more than 15 files, don't do this incrementally. Create a veritas-demo branch, do the full replacement there, and keep the Noble branch intact. That way Noble continues to work while you build Veritas clean.

The one uncomfortable question you're clearly avoiding

Who is the first non-Noble person you're going to show this to, and when? Because if there's no name and no date, this migration is an act of preparation that substitutes for the scarier act of selling.

sorry. 1 downtown, 5 on the southside, 4 on the west side

9:02 AM

Tallied school locations and reorganized the list
Tallied school locations and reorganized the list
Good. That distribution is actually more honest to Chicago's geography - the south side has more surface area and more of the historically underserved communities that a network like Veritas would plant a flag in.

Here's the revised roster:

#	School Name	Neighborhood	Side
1	Veritas Collegiate Academy	Near West Loop (near Murchin/Loop)	Downtown
2	Veritas Englewood Prep	Englewood	South
3	Veritas Roseland Academy	Roseland	South
4	Veritas Woodlawn High School	Woodlawn	South
5	Veritas Auburn Gresham Prep	Auburn Gresham	South
6	Veritas Chatham Academy	Chatham	South
7	Veritas Austin Academy	Austin	West
8	Veritas North Lawndale Prep	North Lawndale	West
9	Veritas Garfield Park High School	East Garfield Park	West
10	Veritas Humboldt Park Academy	Humboldt Park	West
A few things to lock down before you touch the repo:

On the school names - You need a naming convention decision right now, because mixed conventions look sloppy in a demo. Noble uses the street or neighborhood plus a descriptor. Your options are: (1) all "Prep" or "Academy," (2) mix Prep / Academy / High School by grade configuration, or (3) something more distinctive for Veritas. Option 2 is most realistic but requires you to assign grade bands to each school now. What does the network look like - are these K-8, 9-12, or mixed models?

On the downtown school - "Near West Loop near Murchin" is a little geographically loose. Murchin College Prep is at 1711 N. Humboldt - that's actually Humboldt Park, not downtown. If you mean near the Magnificent Mile / Michigan Ave area, that's a different anchor. Clarify the actual anchor so the address is defensible when a prospect asks.

On neighborhoods - All ten of these are legitimate. Every one of them appears on the city's high-priority investment lists. That's not decoration - it's the moral argument for why Veritas exists, and it should be legible in the demo itself.

Now go run that grep. The school list means nothing until you know what you're walking into in the codebase.

just use academy for all. 2) Muchin College Prep is at 1 N. State. Make it near there. These are all fabicrated addresses of course. I mean, they have to be real to map them, but you get my point.
9:05 AM

Consolidated school roster with plausible addresses across Chicago neighborhoods
Consolidated school roster with plausible addresses across Chicago neighborhoods
Good. Clean and consistent. Here's the finalized roster with fabricated-but-mappable addresses:

#	School Name	Address	Neighborhood	Side
1	Veritas Loop Academy	25 W. Monroe St, Chicago, IL 60603	Loop	Downtown
2	Veritas Englewood Academy	641 W. 63rd St, Chicago, IL 60621	Englewood	South
3	Veritas Woodlawn Academy	6338 S. Cottage Grove Ave, Chicago, IL 60637	Woodlawn	South
4	Veritas Auburn Gresham Academy	8039 S. Halsted St, Chicago, IL 60620	Auburn Gresham	South
5	Veritas Roseland Academy	10956 S. Michigan Ave, Chicago, IL 60628	Roseland	South
6	Veritas Chatham Academy	8201 S. Cottage Grove Ave, Chicago, IL 60619	Chatham	South
7	Veritas Austin Academy	231 N. Pine Ave, Chicago, IL 60644	Austin	West
8	Veritas North Lawndale Academy	1616 S. Millard Ave, Chicago, IL 60623	North Lawndale	West
9	Veritas Garfield Park Academy	2345 W. Congress Pkwy, Chicago, IL 60624	East Garfield Park	West
10	Veritas Humboldt Park Academy	3245 W. Division St, Chicago, IL 60651	Humboldt Park	West
All ten addresses are on real streets in the correct neighborhoods. They'll resolve on a map. None of them are actual schools.

Now the next decision before you touch code:

Each school needs a few more data points that will show up across modules. I can generate the full data object right now - enrollment figures, grade bands, founding years, principal names - and hand you a clean schools.ts file ready to drop in. That's faster than you building it field by field later and more likely to be internally consistent across modules.

Do you want me to generate that now? And one question: what grade configuration does Veritas run - K-8, 9-12, 6-12, or mixed across campuses?

yes, but make them all 9-12. mix the enrollment with some large, small, and medium schools.

9:07 AM

Architected diverse Chicago charter schools with varied enrollment sizes
Architected diverse Chicago charter schools with varied enrollment sizes
No repo files here, so I'll write this clean and you drop it in. Let me build it properly.


Created a file, read a file
Created a file, read a file
Here's what you've got:

Enrollment breakdown - total network is 4,788 students across 10 schools. Range goes from 289 (North Lawndale, smallest) to 724 (Loop, largest). Three schools under 400, four in the 400-600 range, three over 600. That's a realistic spread for a charter network - not every campus scales the same way.

Principal names - deliberately diverse. Chicago's south and west side communities are majority Black with significant Latino populations. That's reflected here. It will read as authentic to anyone who knows the city.

What to do with this file:

Drop it at src/data/schools.ts in your repo and then run the grep I outlined earlier. Every module that currently pulls Noble school data needs to import from this file. That's your migration map.

The schoolsByRegion and helper functions at the bottom will save you work when you get to Briefing and the map views in Grounds.

Now the uncomfortable sequencing question: Your Briefing module generates narrative summaries. Those summaries almost certainly have Noble-specific language baked into prompts or static copy - not just data references. After you swap the data layer, read every prompt string in the Brief module out loud and ask whether it says "Noble" anywhere implicitly, even without the word itself.

Schools
TS 
make it 6,823 students and redistribute

9:08 AM

Calibrated student distribution across ten schools with varied enrollment sizes
Calibrated student distribution across ten schools with varied enrollment sizes
Good. Here's how the distribution lands:

School	Enrollment	Size
Loop	987	Large
Chatham	891	Large
Woodlawn	823	Large
Englewood	742	Medium
Austin	711	Medium
Auburn Gresham	678	Medium
Garfield Park	652	Medium
Roseland	521	Medium
Humboldt Park	489	Small
North Lawndale	329	Small
Total	6,823	

Presented file
Presented file
Three things worth noting about this distribution:

Loop at 987 makes sense - downtown location, accessible by transit from anywhere in the city, draws from a wider geography. North Lawndale at 329 also makes sense - it's your newest campus, in one of the most disinvested communities on the west side. Small enrollment there is realistic, not a weakness.

The story that distribution tells - without a word of explanation - is that Veritas plants flags in hard places and builds from the ground up. That's a demo asset, not just a data point.

Next step: Drop this file into src/data/schools.ts and run that grep. Until you know what you're replacing across the codebase, everything else is premature.

Schools
TS 

1773238209145_RosterModule.tsx
tsx

ok i dont specifically have a data flder in SRC.

9:10 AM

Examined file structure to assess data organization
Examined file structure to assess data organization
Let me read the file first.


Check file size and find data references
Check file size and find data references
Claude's response was interrupted
9:10 AM

Identified data structure and architected concrete migration strategy
Identified data structure and architected concrete migration strategy
Now we're working with real information. Here's what the screenshot tells us:

Your data folder is src/sentinel-data/ and the files that matter most for this migration are:

campuses.ts - this is your primary target. School names, IDs, structure.
campusLocations.ts - coordinates. Replace with Veritas addresses.
enrollment.ts - replace with the 6,823 distribution we just built.
compensation.ts, fy26.ts, historical.ts, nst.ts - all carry Noble financial data that will need Veritas figures.
And from the RosterModule you just uploaded, Noble is hardcoded in at least six places:

The HR Assistant system prompt - "Noble Schools... 12,000 students... 17 campuses"
The campus name array on line 82 - lists Noble street names
Staff records - employees assigned to Noble campuses
The chat greeting - "Hi, I'm your Noble HR Assistant"
The HR email - humanresources@nobleschools.org
The network header label - "Noble Schools"
The prioritized hit list:

File	What changes	Urgency
campuses.ts	Full replacement with 10 Veritas schools	First
campusLocations.ts	Replace coordinates with Veritas addresses	First
enrollment.ts	Replace with 6,823 distribution	First
RosterModule.tsx	6 Noble references, system prompt rewrite	Second
compensation.ts	Veritas salary/benefits fiction	Third
fy26.ts, historical.ts	Financial data rebrand	Third
What I'd do right now:

I already built your schools.ts with all 10 Veritas campuses, coordinates, and enrollment. The immediate move is to open campuses.ts in GitHub's web editor and share it here - I'll rewrite it as a clean Veritas file in one shot, using the data we already finalized. Same with campusLocations.ts.

Can you paste the contents of campuses.ts here? That's the linchpin. Everything else in the app likely references campus IDs from that file. Get that one right and the rest follows.


export interface Campus { id: number; name: string; short: string; addr: string; lat: number; lng: number; communityArea: string; areaNumber: number; enroll: number; arrH: number; arrM: number; dH: number; dM: number; // Financial & enrollment metrics perPupil: number;

pasted

9:11 AM

Architected comprehensive dataset for ten charter schools with financial metrics
Architected comprehensive dataset for ten charter schools with financial metrics
Now I have everything I need. The interface is already well-structured - I'm keeping it identical and just replacing all the data.


Created a file, read a file
Created a file, read a file
A few things worth noting about the data decisions baked in here:

The per-pupil story is intentional. Loop is highest at $11,200 - downtown real estate and operating costs justify it. Roseland is lowest at $9,820 - your newest, most underresourced community. That $1,380 spread is actually tighter than Noble's $2,244 spread, which signals a more equitable network. That's a talking point in a demo.

Conversion rates tell a story too. North Lawndale converts 78% of applicants - meaning almost everyone who applies gets in because demand is still being built. Loop converts 47% because it's oversubscribed. Any sophisticated charter operator will read that and nod.

What drops in next:

This file replaces src/sentinel-data/campuses.ts directly via GitHub's web editor. Paste and commit.

Then share campusLocations.ts - that file almost certainly has Noble addresses hardcoded for the map views. It needs to match these exact coordinates. After that, enrollment.ts.

The RosterModule rewrite is a separate piece of work - deeper, because the system prompt needs a full Veritas HR context rewrite, not just find-and-replace. We'll do that after the data layer is clean.

Campuses
TS 

export interface Campus { id: number; name: string; short: string; addr: string; lat: number; lng: number; communityArea: string; areaNumber: number; enroll: number; arrH: number; arrM: number; dH: number; dM: number; } export const CAMPUS_LOCATIONS: Campus[] = [ { id: 1

pasted

9:13 AM

The user prompt is empty, so I cannot determine the primary language. However, based on the thinking block alone, here is a summary: Orchestrated seamless interface migration across educational institutions
The user prompt is empty, so I cannot determine the primary language. However, based on the thinking block alone, here is a summary: Orchestrated seamless interface migration across educational institutions
Clean. Same interface, just replace the data. I'll match exactly to campuses.ts so IDs, coordinates, and enrollments are in sync.


Created a file, read a file
Created a file, read a file
Two things to note:

First - the original had a Gary Comer Middle School (id: 5) that was a middle school entry with no equivalent in campuses.ts. That's gone. Veritas is all 9-12, so no middle school entries exist to create a mismatch. If anything in Grounds or Scholar filters by campus ID, IDs 1-10 are now clean and contiguous.

Second - both files are now in exact agreement: same IDs, same names, same coordinates, same enrollments. Any module that imports from one and cross-references the other won't break.

Next up: Share enrollment.ts. That file almost certainly has 17-campus arrays with Noble-specific figures. After that, compensation.ts and fy26.ts - those are the financial files that will surface in Ledger and are the most likely to still say Noble explicitly in labels or comments.

Campuslocations
TS 
export const ENROLLMENT_SCENARIOS = {
  optimistic: {
    label: 'Optimistic',
    retention: 0.98,
    c1Share: 0.14,
    projections: [
      { year: 'SY26', total: 12192 },
      { year: 'SY27', total: 12180 },
      { year: 'SY28', total: 12175 },
      { year: 'SY29', total: 12160 },
      { year: 'SY30', total: 12150 },
      { year: 'SY31', total: 12140 },
    ],
  },
  probable: {
    label: 'Probable with 3,200',
    retention: 0.98,
    c1Share: 0.135,
    incoming9th: 3200,
    projections: [
      { year: 'SY26', g9: 3200, g10: 3147, g11: 2952, g12: 2856, total: 12155 },
      { year: 'SY27', g9: 3200, g10: 3073, g11: 3022, g12: 2835, total: 12131 },
      { year: 'SY28', g9: 3200, g10: 3073, g11: 2952, g12: 2903, total: 12128 },
      { year: 'SY29', g9: 3250, g10: 3073, g11: 2952, g12: 2835, total: 12110 },
      { year: 'SY30', g9: 3200, g10: 3121, g11: 2952, g12: 2835, total: 12108 },
      { year: 'SY31', g9: 3200, g10: 3073, g11: 2998, g12: 2835, total: 12106 },
    ],
  },
  pessimistic: {
    label: 'Pessimistic',
    retention: 0.97,
    c1Share: 0.13,
    projections: [
      { year: 'SY26', total: 12112 },
      { year: 'SY27', total: 11980 },
      { year: 'SY28', total: 11850 },
      { year: 'SY29', total: 11720 },
      { year: 'SY30', total: 11600 },
      { year: 'SY31', total: 11518 },
    ],
  },
};
export const ENROLLMENT_SPREAD = {
  bySY31: 622,
  revenueImpact: 10.3,  // millions in PCTC
};

Show more
9:14 AM

Rescaled enrollment projections proportionally across smaller institution
Rescaled enrollment projections proportionally across smaller institution
Straightforward scaling job. Noble's base is ~12,155 across 17 campuses. Veritas is 6,823 across 10. The ratio is 0.561 - I'll apply that consistently and rebuild the grade-level breakdowns so the probable scenario math holds internally.


Created a file, read a file
Created a file, read a file
A few decisions worth knowing about:

Optimistic is now a growth story, not a flat line. Noble's optimistic scenario hovered around 12,150-12,192 - essentially flat, a matur

Enrollment
TS 





Claude is AI and can make mistakes. Please double-check responses.
Enrollment · TS
Copy

export const ENROLLMENT_SCENARIOS = {
  optimistic: {
    label: 'Optimistic',
    retention: 0.98,
    c1Share: 0.14,
    projections: [
      { year: 'SY26', total: 6823 },
      { year: 'SY27', total: 6910 },
      { year: 'SY28', total: 6990 },
      { year: 'SY29', total: 7060 },
      { year: 'SY30', total: 7120 },
      { year: 'SY31', total: 7175 },
    ],
  },
  probable: {
    label: 'Probable with 1,800',
    retention: 0.98,
    c1Share: 0.135,
    incoming9th: 1800,
    projections: [
      { year: 'SY26', g9: 1800, g10: 1726, g11: 1662, g12: 1635, total: 6823 },
      { year: 'SY27', g9: 1800, g10: 1726, g11: 1691, g12: 1629, total: 6846 },
      { year: 'SY28', g9: 1800, g10: 1726, g11: 1691, g12: 1657, total: 6874 },
      { year: 'SY29', g9: 1825, g10: 1726, g11: 1691, g12: 1629, total: 6871 },
      { year: 'SY30', g9: 1800, g10: 1751, g11: 1691, g12: 1629, total: 6871 },
      { year: 'SY31', g9: 1800, g10: 1726, g11: 1716, g12: 1629, total: 6871 },
    ],
  },
  pessimistic: {
    label: 'Pessimistic',
    retention: 0.97,
    c1Share: 0.13,
    projections: [
      { year: 'SY26', total: 6823 },
      { year: 'SY27', total: 6720 },
      { year: 'SY28', total: 6620 },
      { year: 'SY29', total: 6524 },
      { year: 'SY30', total: 6430 },
      { year: 'SY31', total: 6340 },
    ],
  },
};

export const ENROLLMENT_SPREAD = {
  bySY31: 835,
  revenueImpact: 5.8,  // millions in PCTC
};





