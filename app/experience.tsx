"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUpRight, Check, ChevronRight, Download, Pause, Play, ShieldCheck, Terminal, X, RotateCcw, Activity, Clock3, Fingerprint } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import PowerScene from "./power-scene";
import { domains, research } from "./domain-data";
import { scenarioMetrics } from "../lib/scenario-metrics";

function n(value: number, digits=1) { return value.toLocaleString("en-US",{ maximumFractionDigits:digits }); }

export default function Experience() {
  const [playing,setPlaying]=useState(true);
  const [time,setTime]=useState(.5);
  const [domain,setDomain]=useState("software");
  const [accepted,setAccepted]=useState(8);
  const [minutes,setMinutes]=useState(120);
  const [wall,setWall]=useState(2);
  const [supervision,setSupervision]=useState(30);
  const [cost,setCost]=useState(12);
  const [replay,setReplay]=useState(0);
  const [checks,setChecks]=useState<string[]|null>(null);
  const [copied,setCopied]=useState(false);
  const selected=domains.find(d=>d.id===domain)!;
  const {credit,power,exponent,leverage}=scenarioMetrics(accepted,minutes,wall,supervision,cost);
  const [scale,setScale]=useState(3);
  const scalePower=2**scale;
  const sample=useMemo(()=>[
    {id:"FIX 001",label:"Correct + reviewed",state:"Accepted",credit:2},
    {id:"FIX 002",label:"Regression test failed",state:"Rejected",credit:0},
    {id:"FIX 003",label:"Correct + reviewed",state:"Accepted",credit:2},
    {id:"FIX 001",label:"Same deliverable again",state:"Duplicate",credit:0},
    {id:"FIX 004",label:"Correct + reviewed",state:"Accepted",credit:2},
    {id:"FIX 005",label:"Missing reviewer evidence",state:"Unverified",credit:0},
  ],[]);
  const replayCredit=sample.slice(0,replay).reduce((s,r)=>s+r.credit,0);

  useEffect(()=>{
    const media=window.matchMedia("(prefers-reduced-motion: reduce)");
    if(media.matches) setPlaying(false);
    const observer=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("entered");}),{threshold:.1});
    document.querySelectorAll(".reveal").forEach(e=>observer.observe(e));
    return()=>observer.disconnect();
  },[]);
  function choose(id:string) { const d=domains.find(d=>d.id===id)!;setDomain(id);setMinutes(d.minutes);setAccepted(8);setWall(2);setChecks(null); }
  function reset(){choose("software");setSupervision(30);setCost(12);}
  async function runChecks(){
    const {scenarioMetrics}=await import("../lib/scenario-metrics");
    const cases=[
      ["Human parity: 2 hours of credit / 2 hours = 1 AP",scenarioMetrics(1,120,2,0,0).power===1],
      ["Doubling output adds exactly 1 to APx",scenarioMetrics(8,120,2,0,0).exponent===3],
      ["Zero accepted output never becomes infinite power",scenarioMetrics(0,120,2,0,0).exponent===null],
      ["More elapsed time reduces power",scenarioMetrics(8,120,4,0,0).power===4],
      ["Duplicates do not add output credit",sample.reduce((s,r)=>s+r.credit,0)===6],
      ["No supervision is reported as a null leverage ratio",scenarioMetrics(8,120,2,0,0).leverage===null],
    ] as const;
    setChecks(cases.map(([label,pass])=>(pass?"PASS":"FAIL")+" · "+label));
  }
  async function copyCommand(){try{await navigator.clipboard.writeText("node benchmark/bin/apx.mjs demo");setCopied(true);}catch{setCopied(false);}}
  function downloadScenario(){
    const blob=new Blob([JSON.stringify({schema:"apx.scenario/v1",evidenceStatus:"synthetic",notABenchmarkReceipt:true,domain,accepted,referenceMinutes:minutes,wallHours:wall,humanSupervisionMinutes:supervision,totalCostUsd:cost,AP:power,APx:exponent,referenceHumanHours:credit,notice:"Illustrative assumptions only. Not a measured score or certificate."},null,2)],{type:"application/json"});
    const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="apx-synthetic-scenario.json";a.click();URL.revokeObjectURL(url);
  }
  return <main>
    <a className="skip-link" href="#lab">Skip to power calculator</a>
    <header className="site-header">
      <a className="brand" href="#home" aria-label="APx home">AP<span>x</span><small>AGENTIC<br/>POWER</small></a>
      <nav aria-label="Main navigation"><a href="#plain">Start here</a><a href="#unit">The unit</a><a href="#lab">Power lab</a><a href="#research">Research</a></nav>
      <a className="header-link" href="#framework">Read the standard <ArrowUpRight size={16}/></a>
    </header>

    <section id="home" className="hero">
      <div className="hero-grid"></div>
      <div className="hero-copy">
        <p className="eyebrow"><span className="small-square"/> A NEW REFERENCE FOR USEFUL WORK</p>
        <h1>Intelligence,<br/>measured<br/>in <em>work.</em></h1>
        <p className="hero-intro">APx asks a simple question:<br/><strong>How much finished, approved work did the agents produce?</strong></p>
        <a className="button primary" href="#plain">See a simple example <ArrowDown size={17}/></a>
        <p className="hero-foot">Compare the same task. Count only accepted results. Include all elapsed time.</p>
      </div>
      <div className="hero-instrument">
        <div className="instrument-label"><span>APx / INSTRUMENT 001</span><span>3D + TIME</span></div>
        <PowerScene power={power} time={time} playing={playing}/>
        <div className="floating-reading"><span>ILLUSTRATIVE OUTPUT</span><div>{n(power)}<small>AP</small></div><p>APx {exponent===null?"undefined":n(exponent,2)}</p></div>
        <div className="instrument-controls"><button onClick={()=>setPlaying(!playing)} aria-label={playing?"Pause animation":"Play animation"}>{playing?<Pause size={15}/>:<Play size={15}/>}</button><div><label id="time-label">REPLAY TIME <span>{Math.round(time*100)}%</span></label><Slider aria-labelledby="time-label" value={[time*100]} min={0} max={100} step={1} onValueChange={v=>{setTime(v[0]/100);setPlaying(false);}}/></div><span className="control-caption">THE FOURTH<br/>DIMENSION</span></div>
      </div>
      <div className="hero-bottom"><span>SCROLL TO UNDERSTAND <ArrowDown size={13}/></span><span>PROPOSED STANDARD / v0.1 / BY rUv</span><span>DEMONSTRATION, NOT TELEMETRY</span></div>
    </section>

    <section id="plain" className="section plain-section">
      <div className="plain-lead reveal">
        <p className="eyebrow">START HERE / APx IN SIMPLE TERMS</p>
        <h2>Think of APx as<br/><em>horsepower for agents.</em></h2>
        <p>A car engine needs horsepower so we can compare useful pulling power. Agent systems need APx so we can compare useful work. APx counts finished work that passes review. Busy agents, long runtimes and large amounts of code do not count by themselves.</p>
      </div>
      <div className="simple-example reveal" aria-label="Simple Agentic Power example">
        <div className="example-person">
          <span className="example-label">A QUALIFIED PERSON</span>
          <strong>8 hours</strong>
          <p>to complete and approve one defined task</p>
        </div>
        <span className="example-arrow" aria-hidden="true">→</span>
        <div className="example-agent">
          <span className="example-label">THE AGENT SYSTEM</span>
          <strong>1 hour</strong>
          <p>to deliver the same approved result</p>
        </div>
        <span className="example-equals" aria-hidden="true">=</span>
        <div className="example-score">
          <span className="example-label">AGENTIC POWER</span>
          <strong>8 <small>AP</small></strong>
          <p>Eight times the human reference rate, shown as APx 3</p>
        </div>
      </div>
      <div className="plain-rules reveal">
        <article><span>01</span><div><h3>Start with the same job</h3><p>Compare the agent and person against one clear task and one acceptance standard.</p></div></article>
        <article><span>02</span><div><h3>Count work that passes</h3><p>Broken, repeated or unverified output earns no credit. Its time and cost still count.</p></div></article>
        <article><span>03</span><div><h3>Include the full workflow</h3><p>Measure waiting, retries, review, correction and human help from start to finish.</p></div></article>
      </div>
      <p className="plain-summary reveal"><strong>One sentence:</strong> APx tells you how quickly an agent system produces approved work compared with a qualified person doing the same job.</p>
    </section>

    <section id="unit" className="section unit-section">
      <div className="section-top reveal"><p className="eyebrow">01 / THE UNIT</p><span className="section-aside">OUTPUT, NOT ACTIVITY</span></div>
      <div className="two-col reveal"><h2>Not how busy.<br/><span className="muted">How useful.</span></h2><div className="intro-prose"><p>Ten agents running for an hour tells you how busy the system was. It does not tell you whether anything useful happened.</p><p>AP measures accepted work per hour against a qualified human reference. APx puts that multiplier on a simple doubling scale.</p></div></div>
      <div className="definition-grid reveal">
        <article><span className="definition-mark">1<span>AP</span></span><h3>One human baseline</h3><p>The same accepted output rate as a qualified human, on the same kind of task, under a declared protocol.</p></article>
        <article><span className="definition-mark accent">8<span>AP</span></span><h3>Eight times the output</h3><p>Eight reference hours of accepted work delivered in one elapsed hour by the declared system.</p></article>
        <article><span className="definition-mark">3<span>APx</span></span><h3>A compact exponent</h3><p>Two to the power of three equals eight. Each extra APx point doubles the output multiplier.</p></article>
      </div>
      <div className="formula-strip"><span>THE DEFINITION</span><strong>AP = accepted human reference hours ÷ elapsed hours</strong><strong className="accent">APx = log₂(AP)</strong></div>
      <p className="fineprint">A proposed relative measure, not an SI unit, intelligence score, or employment replacement claim. Zero accepted output means 0 AP; its exponent is undefined.</p>
    </section>

    <section className="scale-section section">
      <div className="scale-copy reveal"><p className="eyebrow">02 / FEEL THE SCALE</p><h2>Every step.<br/><em>Twice the work.</em></h2><p>Move the exponent. Watch the output grow.</p><p className="fineprint">The exponent is a display scale. It does not prove exponential improvement over time.</p></div>
      <div className="scale-instrument reveal">
        <div className="scale-value"><span>APx <b>{n(scale,1)}</b></span><strong>{n(scalePower,2)}<small>AP</small></strong></div>
        <div className="power-cells" aria-hidden="true">{Array.from({length:64},(_,i)=><div key={i} className={i<Math.round(scalePower)?"lit":""}/>)}</div>
        <Slider aria-label="Explore APx exponent" value={[scale]} min={-2} max={6} step={.5} onValueChange={v=>setScale(v[0])}/>
        <div className="scale-ticks"><span>−2 / 0.25 AP</span><span>0 / 1 AP</span><span>3 / 8 AP</span><span>6 / 64 AP</span></div>
        <p className="scale-note">{scalePower>=1? `In one hour: the accepted work of ${n(scalePower,2)} reference human hours.`:`Below human parity: ${n(scalePower*100)}% of the reference output rate.`} Cells are rounded; the numeric value is exact to the displayed precision.</p>
      </div>
    </section>

    <section id="lab" className="section lab-section">
      <div className="section-top reveal"><p className="eyebrow">03 / THE POWER LAB</p><span className="pill">SYNTHETIC SCENARIO</span></div>
      <div className="two-col lab-heading reveal"><h2>Put a real job<br/>in the equation.</h2><p>Choose a kind of work. Change the assumptions. The math updates instantly. These are teaching examples, not industry averages.</p></div>
      <div className="lab-grid">
        <div className="lab-inputs">
          <label className="field-label" id="domain-label">KIND OF WORK</label>
          <Select value={domain} onValueChange={choose}><SelectTrigger aria-labelledby="domain-label" className="domain-select"><SelectValue/></SelectTrigger><SelectContent>{domains.map(d=><SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}</SelectContent></Select>
          <p className="task-description">{selected.example}</p>
          <div className="range-field"><label id="accepted-label">Accepted outputs <strong>{accepted}</strong></label><Slider aria-labelledby="accepted-label" value={[accepted]} min={0} max={32} step={1} onValueChange={v=>setAccepted(v[0])}/><p>Unique {selected.unit}. Failed work earns no credit.</p></div>
          <div className="range-field"><label id="reference-label">Human reference per output <strong>{minutes} min</strong></label><Slider aria-labelledby="reference-label" value={[minutes]} min={15} max={600} step={15} onValueChange={v=>setMinutes(v[0])}/><p>A hypothetical baseline here. Real scores need observed human trials, including failures.</p></div>
          <div className="range-field"><label id="wall-label">Total elapsed time <strong>{n(wall,2)} hours</strong></label><Slider aria-labelledby="wall-label" value={[wall]} min={.25} max={16} step={.25} onValueChange={v=>setWall(v[0])}/><p>Includes retries, waiting, review, repair, and integration.</p></div>
          <div className="small-inputs"><label>Human labor minutes<input type="number" min="0" max="100000" value={supervision} onChange={e=>setSupervision(Math.max(0,Math.min(100000,Number(e.target.value)||0)))}/></label><label>Total cost USD<input type="number" min="0" max="1000000" step="1" value={cost} onChange={e=>setCost(Math.max(0,Math.min(1000000,Number(e.target.value)||0)))}/></label></div>
          <button className="text-button" onClick={reset}><RotateCcw size={14}/> Reset example</button>
        </div>
        <div className="lab-result">
          <div className="result-caption"><span>AGENTIC POWER</span><Activity size={17}/></div>
          <div className="result-number" aria-live="polite">{n(power,2)}<span>AP</span></div>
          <div className="exponent-row"><span>Exponent</span><strong>APx {exponent===null?"undefined":n(exponent,2)}</strong></div>
          <p className="result-explanation">{accepted===0?"No accepted output. Runtime alone earns no power.":`${accepted} accepted outputs × ${minutes} reference minutes = ${n(credit)} human reference hours, delivered in ${n(wall,2)} elapsed hours.`}</p>
          <div className="result-rule"/>
          <div className="result-metrics"><div><span>Reference work</span><strong>{n(credit/8,2)}<small>eight hour days</small></strong></div><div><span>Human labor leverage</span><strong>{leverage===null?"N/A":n(leverage,1)+"×"}<small>{supervision===0?"No human labor recorded":"Separate from AP"}</small></strong></div><div><span>Cost per reference hour</span><strong>{credit>0?"$"+n(cost/credit,2):"N/A"}<small>All costs entered above</small></strong></div><div><span>Evidence status</span><strong className="status-word">Synthetic<small>No measured cohort</small></strong></div></div>
          <div className="gate-note"><ShieldCheck size={19}/><div><strong>Acceptance comes first</strong><p>{selected.gate}</p></div></div>
          <button className="button outline" onClick={downloadScenario}>Export this scenario <Download size={15}/></button>
        </div>
      </div>
      <div className="reality-check"><strong>What this means in plain language</strong><p>If a system sustains 20 AP for eight hours, it delivers 160 reference human hours: 20 working days. Sustained for 250 such days, that is 20 reference working years of accumulated output. Neither statement means 20 years of work in one day.</p></div>
    </section>

    <section id="spectrum" className="section spectrum-section">
      <div className="section-top reveal"><p className="eyebrow">04 / A SPECTRUM, NOT A CROWN</p><span className="section-aside">12 STARTING DOMAINS</span></div>
      <div className="two-col reveal"><h2>One language.<br/>Different standards.</h2><p>A code fix, a book chapter, and a clinical workflow are not interchangeable. Compare like with like. A high score in one area says nothing about untested areas.</p></div>
      <div className="domain-grid">{domains.map((d,i)=><button key={d.id} className={"domain-card "+(domain===d.id?"selected":"")} onClick={()=>choose(d.id)} aria-pressed={domain===d.id}><span className="domain-index">{String(i+1).padStart(2,"0")}</span><h3>{d.name}</h3><p>{d.unit}</p><span className="domain-capability">{d.capability}</span><ChevronRight size={17}/></button>)}</div>
      <div className="domain-detail"><div><span className="eyebrow">SELECTED DOMAIN / {selected.name.toUpperCase()}</span><h3>{selected.reference}</h3><p>{selected.example}</p></div><div><span className="field-label">ACCEPTANCE GATE</span><p>{selected.gate}</p><p className="boundary">{selected.boundary}</p></div></div>
      <p className="fineprint">These are proposed task profiles, not validated benchmark suites or measured occupational coverage. O*NET mappings require a versioned crosswalk and domain expert review.</p>
    </section>

    <section className="section receipt-section">
      <div className="section-top reveal"><p className="eyebrow">05 / ONLY WORK THAT SURVIVES</p><Fingerprint size={22}/></div>
      <div className="two-col reveal"><h2>Show the work.<br/><span className="muted">Then count it.</span></h2><p>Evidence moves through an acceptance gate. Errors, repeated artifacts, and unsupported claims do not get added to the score. Their time and cost still count.</p></div>
      <div className="replay-grid"><div className="receipt-list">{sample.map((r,i)=><div key={i} className={"receipt-row "+(i<replay?"processed":"pending")}><span className="receipt-icon">{i>=replay?<Clock3 size={16}/>:r.credit>0?<Check size={16}/>:<X size={16}/>}</span><div><strong>{r.id}</strong><p>{r.label}</p></div><span>{i<replay?r.state:"Pending"}</span><b>{i<replay?"+"+r.credit+" h":"···"}</b></div>)}</div><div className="replay-reading"><span className="eyebrow">SYNTHETIC EVIDENCE REPLAY</span><strong>{replayCredit}<small>reference hours</small></strong><p>{replay} of 6 receipts processed. This replay illustrates accounting; it is not a live agent run.</p><button className="button primary" onClick={()=>setReplay(replay<6?replay+1:0)}>{replay<6?"Process next receipt":"Replay from start"}<ChevronRight size={17}/></button><p className="fineprint">Signatures prove origin and integrity. They do not prove that the work is correct.</p></div></div>
    </section>

    <section id="framework" className="section framework-section">
      <div className="section-top reveal"><p className="eyebrow">06 / A MEASURE YOU CAN REPLAY</p><span className="pill">SPECIFICATION 0.1</span></div>
      <div className="two-col reveal"><h2>Built for the<br/>RuV execution stack.</h2><p>Keep measurement independent from optimization. The system can improve its approach. It cannot rewrite the exam to improve its score.</p></div>
      <Tabs defaultValue="protocol" className="framework-tabs"><TabsList className="framework-tablist"><TabsTrigger value="protocol">The protocol</TabsTrigger><TabsTrigger value="stack">The RuV stack</TabsTrigger><TabsTrigger value="run">Run the harness</TabsTrigger></TabsList>
        <TabsContent value="protocol"><div className="protocol-grid">{[
          ["01","Define","Freeze the job, input data, quality rubric, budget, tools, environment, and completion window."],
          ["02","Calibrate","Measure qualified humans with the same protocol. Include unsuccessful attempts in the reference rate."],
          ["03","Execute","Run declared candidates. Meter elapsed time, human help, compute use, failures, and all costs."],
          ["04","Adjudicate","Use independent review and task checks. Reject unsafe, repeated, or unsupported outputs."],
          ["05","Compare","Calculate AP and APx. Report uncertainty, task coverage, assistance mode, and evidence grade."],
          ["06","Improve","Tune only on development tasks. Evaluate a separate holdout. Retain rollback and human approval."]
        ].map(([i,title,body])=><article key={i}><span>{i}</span><h3>{title}</h3><p>{body}</p></article>)}</div></TabsContent>
        <TabsContent value="stack"><div className="stack-table">{[
          ["Ruflo","Coordination and bounded work ownership","Pinned CLI used to coordinate this build."],
          ["MetaHarness","Build time benchmark and candidate governance","Native 0.10.2 suite hash verification passed. This is a visible conformance wrapper, not a hidden occupational test."],
          ["Autogenous","Runtime evidence and adaptation boundary","APx contract adapter. Native runtime integration is not validated."],
          ["ruClip","Job, employee, issue, budget, approval context","APx context adapter. Approval alone never establishes correctness."],
          ["APx kernel","Independent scoring and evidence checks","Local scoring, validation, synthetic fixtures, CLI, and tests."]
        ].map(([name,role,status])=><div key={name}><strong>{name}</strong><p>{role}</p><span>{status}</span></div>)}</div><p className="fineprint">Public source contracts were inspected. This is not a claim of an upstream merge, deployed RuV service, or full native interoperability.</p></TabsContent>
        <TabsContent value="run"><div className="run-panel"><div><Terminal size={25}/><h3>Reproduce before you trust.</h3><p>The downloadable package contains the specification, scoring code, task profiles, synthetic fixtures, adapters, and executable invariants. Node 22 or newer. No API key is needed for the synthetic demo.</p><a className="button primary" href="/downloads/apx-benchmark.zip" download>Download benchmark <Download size={16}/></a></div><div className="terminal-block"><span>FROM THE EXTRACTED PACKAGE</span><code>node benchmark/bin/apx.mjs demo</code><button className="text-button" onClick={copyCommand}>{copied?"Copied":"Copy command"}</button><code>cd benchmark<br/>node --test test/core.test.mjs<br/>node --test .harness/generate.test.mjs</code><p>Demo scores are synthetic. Live human baselines and external model runs are not included.</p></div></div></TabsContent>
      </Tabs>
      <div className="download-strip"><a href="/downloads/APx-Specification.md" download><div><span>THE FULL SPECIFICATION</span><strong>Definition, methods, governance, and adoption</strong></div><Download size={21}/></a><a href="/downloads/APx-Research.md" download><div><span>THE RESEARCH BRIEF</span><strong>Evidence, prior art, and limitations</strong></div><Download size={21}/></a></div>
      <div className="conformance"><div><h3>Check the core arithmetic.</h3><p>Six browser checks exercise this explainer. The package contains the full Node test suite.</p></div><button className="button outline" onClick={runChecks}>Run browser checks <Play size={15}/></button></div>
      {checks&&<ul className="check-results" aria-live="polite">{checks.map(c=><li key={c}><Check size={14}/>{c}</li>)}</ul>}
    </section>

    <section id="research" className="section research-section">
      <div className="section-top reveal"><p className="eyebrow">07 / BUILT ON EVIDENCE</p><span className="section-aside">RESEARCHED 07 SEP 2026</span></div>
      <div className="two-col reveal"><h2>The field is moving.<br/>The measure must hold.</h2><p>APx combines established evaluation lessons into a proposed accounting layer. It does not replace domain benchmarks or claim to be an adopted standard.</p></div>
      <div className="research-grid">{research.map((s,i)=><a className="research-card" href={s.url} target="_blank" rel="noreferrer" key={s.url}><div><span>{s.publisher}</span><ArrowUpRight size={17}/></div><h3>{s.title}</h3><p>{s.text}</p><p className="design-rule"><span>APx DESIGN RULE</span>{s.design}</p><small>{s.date}</small></a>)}</div>
    </section>

    <section className="closing section">
      <p className="eyebrow">THE FIRST SCORE SHOULD EARN YOUR TRUST.</p>
      <h2>Less counting code.<br/><em>More counting outcomes.</em></h2>
      <div className="personal-status"><span>rUv’s measured APx</span><strong>Not measured yet.</strong><p>The earlier 20 workday estimate and 100 million line count are not calibration data. A real score needs timed human reference trials and independently accepted agent outputs.</p></div>
      <a className="button primary" href="/downloads/APx-Specification.md" download>Explore the specification <Download size={16}/></a>
      <p className="closing-note">The next step: a matched pilot on bounded software maintenance tasks.</p>
    </section>
    <footer><a className="brand" href="#home">AP<span>x</span></a><p>AGENTIC POWER / A PROPOSAL BY rUv</p><span>Task specific. Evidence first. Human governed.</span><a href="#home">Back to top ↑</a></footer>
  </main>;
}
