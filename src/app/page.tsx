'use client'

import { useState, useMemo, useRef, useEffect } from 'react'
import subjects from '@/data/subjects.json'
import universityData from '@/data/universityRecommendations.json'

type Subject = (typeof subjects)[0]
type UniRec = { university: string; field: string }
type UniFields = Record<string, { category: string; major: string; recommendedAreas: string[]; ourSubjects: string[] }>
type UniData = Record<string, { name: string; fields: UniFields }>
const uniData = universityData as UniData

const groupColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  '국어': { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', badge: 'bg-blue-100' },
  '수학': { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200', badge: 'bg-indigo-100' },
  '영어': { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', badge: 'bg-emerald-100' },
  '사회': { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', badge: 'bg-amber-100' },
  '과학': { bg: 'bg-violet-50', text: 'text-violet-700', border: 'border-violet-200', badge: 'bg-violet-100' },
  '체육': { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200', badge: 'bg-rose-100' },
  '예술': { bg: 'bg-pink-50', text: 'text-pink-700', border: 'border-pink-200', badge: 'bg-pink-100' },
  '기술·가정': { bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200', badge: 'bg-teal-100' },
  '제2외국어/한문': { bg: 'bg-cyan-50', text: 'text-cyan-700', border: 'border-cyan-200', badge: 'bg-cyan-100' },
  '교양': { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200', badge: 'bg-gray-100' },
}
const typeLabels: Record<string, { label: string; color: string }> = {
  '공통': { label: '공통', color: 'bg-slate-600 text-white' },
  '일반': { label: '일반 선택', color: 'bg-blue-600 text-white' },
  '진로': { label: '진로 선택', color: 'bg-purple-600 text-white' },
  '융합': { label: '융합 선택', color: 'bg-teal-600 text-white' },
}
const allGroups = ['전체','국어','수학','영어','사회','과학','체육','예술','기술·가정','제2외국어/한문','교양']
const careerFields = [
  { id:'humanities', name:'인문', desc:'영어영문, 철학' },
  { id:'social', name:'사회', desc:'경영, 심리' },
  { id:'education', name:'교육', desc:'국어교육, 수학교육' },
  { id:'natural', name:'자연', desc:'생명과학, 물리, 화학' },
  { id:'engineering', name:'공학', desc:'기계공학, 컴퓨터공학' },
  { id:'medical', name:'의약', desc:'약학, 의예' },
  { id:'arts', name:'예체능', desc:'시각디자인, 음악, 체육' },
]
const TABS = ['과목 목록','진로별 추천','대학별 권장','AI 상담'] as const
type Tab = (typeof TABS)[number]

function offlineChat(q: string): string {
  const query = q.toLowerCase().trim()
  const uniNames = Object.keys(uniData)
  for (const uni of uniNames) {
    if (query.includes(uni.toLowerCase())) {
      const fields = uniData[uni].fields
      const list = Object.entries(fields).filter(([,v]) => v.ourSubjects.length > 0)
        .map(([,v]) => `[${v.category} > ${v.major}]\n  ${v.ourSubjects.join(', ')}`).join('\n')
      if (list) return `${uni} 권장과목 (우리 학교 기준)\n\n${list}\n\n※ 2028학년도 대교협 자료 기준`
    }
  }
  const kw: Record<string,string[]> = {
    '의사|의대|의예|의학':['의약'], '약사|약대|약학':['의약'],
    '공학|엔지니어|기계':['공학'], '컴퓨터|프로그래|코딩|소프트웨어|IT':['공학'],
    '경영|경제|상경|회계':['사회'], '심리|상담':['사회'],
    '교사|교육|선생님':['교육'], '생명|생물|바이오':['자연'],
    '물리|역학':['자연'], '화학|화공':['자연'],
    '디자인|미술':['예체능'], '체육|스포츠':['예체능'],
    '영어|영문|통역|번역':['인문'], '철학|인문':['인문'],
  }
  for (const [keywords, cats] of Object.entries(kw)) {
    if (new RegExp(keywords).test(query)) {
      const subjectSet = new Set<string>()
      const uniList: string[] = []
      for (const uni of uniNames) {
        for (const [,fd] of Object.entries(uniData[uni].fields)) {
          if (cats.includes(fd.category) && fd.ourSubjects.length > 0) {
            fd.ourSubjects.forEach(s => subjectSet.add(s))
            uniList.push(`${uni}: ${fd.ourSubjects.join(', ')}`)
          }
        }
      }
      if (subjectSet.size > 0) {
        return `${cats.join(', ')} 계열 추천 과목\n\n추천: ${[...subjectSet].sort().join(', ')}\n\n대학 예시:\n${uniList.slice(0,6).join('\n')}\n\n※ 2028학년도 대교협 자료 기준`
      }
    }
  }
  const found = subjects.filter(s => s.name.toLowerCase().includes(query) || query.includes(s.name.toLowerCase()))
  if (found.length > 0 && found.length <= 5) {
    return found.map(s => {
      const uniCount = new Set((s.recommendingUniversities as UniRec[])?.map(r => r.university)||[]).size
      return `${s.name} (${typeLabels[s.type]?.label||s.type})\n교과: ${s.subjectGroup} | ${s.opCredit}학점 | ${s.category}\n${s.description}${s.relatedMajors?'\n관련 학과: '+s.relatedMajors:''}${s.relatedJobs?'\n관련 직업: '+s.relatedJobs:''}${uniCount>0?'\n\n'+uniCount+'개 대학에서 권장':''}`
    }).join('\n\n---\n\n')
  }
  if (query.includes('1학년')||query.includes('2026')) {
    const g = subjects.filter(s => s.targetGrades.some(t => t.includes('2026')))
    const grouped: Record<string,string[]> = {}
    g.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s.name) })
    return `1학년(2026 신입) 과목\n\n${Object.entries(grouped).map(([k,v])=>`[${k}] ${v.join(', ')}`).join('\n')}\n\n총 ${g.length}개`
  }
  if (query.includes('2학년')||query.includes('2025')) {
    const g = subjects.filter(s => s.targetGrades.some(t => t.includes('2025')))
    const grouped: Record<string,string[]> = {}
    g.forEach(s => { if(!grouped[s.category]) grouped[s.category]=[]; grouped[s.category].push(s.name) })
    return `2학년(2025 신입) 과목\n\n${Object.entries(grouped).map(([k,v])=>`[${k}] ${v.join(', ')}`).join('\n')}\n\n총 ${g.length}개`
  }
  for (const group of allGroups.slice(1)) {
    if (query.includes(group.toLowerCase())) {
      const gs = subjects.filter(s => s.subjectGroup === group)
      if (gs.length > 0) return `${group} 교과\n\n${gs.map(s=>`${s.name} (${typeLabels[s.type]?.label||s.type}, ${s.opCredit}학점)`).join('\n')}\n\n총 ${gs.length}개`
    }
  }
  return `안녕하세요! 순천팔마고 선택과목 챗봇입니다.\n\n이런 질문을 해보세요:\n- "의사가 되려면 어떤 과목?"\n- "서울대 권장과목 알려줘"\n- "기하 과목 설명해줘"\n- "2학년 과목 알려줘"\n- "컴퓨터공학과 가려면?"\n\n${subjects.length}개 과목 + ${Object.keys(uniData).length}개 대학 정보 제공`
}

export default function Home() {
  const [tab,setTab] = useState<Tab>('과목 목록')
  const [search,setSearch] = useState('')
  const [selGroup,setSelGroup] = useState('전체')
  const [selType,setSelType] = useState('전체')
  const [selGrade,setSelGrade] = useState('전체')
  const [selCat,setSelCat] = useState('전체')
  const [modal,setModal] = useState<Subject|null>(null)
  const [career,setCareer] = useState(careerFields[0].id)
  const [uniSearch,setUniSearch] = useState('')
  const [selUni,setSelUni] = useState<string|null>(null)
  const [msgs,setMsgs] = useState<{role:string;content:string}[]>([])
  const [chatIn,setChatIn] = useState('')
  const [loading,setLoading] = useState(false)
  const chatEnd = useRef<HTMLDivElement>(null)
  useEffect(()=>{chatEnd.current?.scrollIntoView({behavior:'smooth'})},[msgs])

  const filtered = useMemo(()=>subjects.filter(s=>{
    const mSearch = s.name.toLowerCase().includes(search.toLowerCase())||s.description.toLowerCase().includes(search.toLowerCase())
    const mGroup = selGroup==='전체'||s.subjectGroup===selGroup
    const mType = selType==='전체'||s.type===selType
    const mGrade = selGrade==='전체'||(selGrade==='2026 신입생'&&s.targetGrades.some(g=>g.includes('2026')))||(selGrade==='2025 신입생'&&s.targetGrades.some(g=>g.includes('2025')))
    const mCat = selCat==='전체'||s.category===selCat
    return mSearch&&mGroup&&mType&&mGrade&&mCat
  }),[search,selGroup,selType,selGrade,selCat])

  const stats = useMemo(()=>({
    total:filtered.length,
    common:filtered.filter(s=>s.type==='공통').length,
    general:filtered.filter(s=>s.type==='일반').length,
    career:filtered.filter(s=>s.type==='진로').length,
    convergence:filtered.filter(s=>s.type==='융합').length,
  }),[filtered])

  const uniList = useMemo(()=>Object.keys(uniData).sort(),[])
  const filteredUnis = useMemo(()=>uniSearch?uniList.filter(u=>u.includes(uniSearch)):uniList,[uniList,uniSearch])

  const careerSubjects = useMemo(()=>{
    const c = careerFields.find(x=>x.id===career)
    if(!c) return []
    const set = new Set<string>()
    for(const uni of Object.values(uniData)){
      for(const[,fd] of Object.entries(uni.fields)){
        if(fd.category===c.name) fd.ourSubjects.forEach(s=>set.add(s))
      }
    }
    return subjects.filter(s=>set.has(s.name))
  },[career])

  const handleChat = async()=>{
    if(!chatIn.trim()) return
    const msg = chatIn.trim()
    setChatIn('')
    setMsgs(p=>[...p,{role:'user',content:msg}])
    setLoading(true)
    try {
      const res = await fetch('/api/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:msg})})
      if(res.ok){const d=await res.json();setMsgs(p=>[...p,{role:'assistant',content:d.reply}])}
      else{setMsgs(p=>[...p,{role:'assistant',content:offlineChat(msg)}])}
    }catch{setMsgs(p=>[...p,{role:'assistant',content:offlineChat(msg)}])}
    setLoading(false)
  }

  const gc = (g:string)=>groupColors[g]||groupColors['교양']

  return (
    <div className="min-h-screen">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <div>
              <h1 className="text-lg sm:text-xl font-bold text-gray-900">순천팔마고등학교</h1>
              <p className="text-xs text-gray-500">2022 개정 교육과정 선택과목 안내</p>
            </div>
            <div className="flex gap-1.5 text-[10px]">
              <span className="px-2 py-1 rounded bg-blue-50 text-blue-700 font-medium">2026 신입생</span>
              <span className="px-2 py-1 rounded bg-emerald-50 text-emerald-700 font-medium">2025 신입생</span>
              <span className="px-2 py-1 rounded bg-gray-100 text-gray-500 font-medium">{subjects.length}개 과목</span>
              <span className="px-2 py-1 rounded bg-orange-50 text-orange-600 font-medium">{Object.keys(uniData).length}개 대학</span>
            </div>
          </div>
          <div className="flex gap-1 mt-3 -mb-px overflow-x-auto">
            {TABS.map(t=>(<button key={t} onClick={()=>setTab(t)} className={`px-4 py-2 text-sm font-medium rounded-t-lg border border-b-0 whitespace-nowrap transition-colors ${tab===t?'bg-white text-gray-900 border-gray-200':'bg-gray-50 text-gray-500 border-transparent hover:text-gray-700'}`}>{t}</button>))}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {tab==='과목 목록'&&(<>
          <div className="bg-white rounded-lg border border-gray-200 p-4 mb-5">
            <div className="relative mb-3">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
              <input type="text" placeholder="과목명 또는 키워드로 검색..." value={search} onChange={e=>setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
            </div>
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-500 mb-1.5">교과</p>
              <div className="flex flex-wrap gap-1.5">{allGroups.map(g=>(<button key={g} onClick={()=>setSelGroup(g)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${selGroup===g?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{g}</button>))}</div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1.5">유형</p>
                <div className="flex flex-wrap gap-1.5">{['전체','공통','일반','진로','융합'].map(t=>(<button key={t} onClick={()=>setSelType(t)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${selType===t?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t==='전체'?'전체':typeLabels[t]?.label||t}</button>))}</div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1.5">입학 연도</p>
                <div className="flex flex-wrap gap-1.5">{['전체','2026 신입생','2025 신입생'].map(g=>(<button key={g} onClick={()=>setSelGrade(g)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${selGrade===g?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{g}</button>))}</div>
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-gray-500 mb-1.5">구분</p>
                <div className="flex flex-wrap gap-1.5">{['전체','학교지정','학생선택(2학년)','학생선택(3학년)'].map(c=>(<button key={c} onClick={()=>setSelCat(c)} className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${selCat===c?'bg-gray-900 text-white':'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{c}</button>))}</div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3 mb-4 text-xs text-gray-500">
            <span className="font-medium text-gray-900">{stats.total}개 과목</span>
            <span className="text-gray-300">|</span>
            <span>공통 {stats.common}</span><span>일반 {stats.general}</span><span>진로 {stats.career}</span><span>융합 {stats.convergence}</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {filtered.map(s=>{const colors=gc(s.subjectGroup);const uniCount=new Set((s.recommendingUniversities as UniRec[])?.map(r=>r.university)||[]).size;return(
              <button key={s.id} onClick={()=>setModal(s)} className={`text-left p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-shadow`}>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className={`font-semibold text-sm ${colors.text}`}>{s.name}</h3>
                  <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${typeLabels[s.type]?.color}`}>{typeLabels[s.type]?.label}</span>
                </div>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <span className={`px-1.5 py-0.5 text-[10px] rounded ${colors.badge} ${colors.text}`}>{s.subjectGroup}</span>
                  <span className="text-[10px] text-gray-500">{s.opCredit}학점</span>
                  <span className="text-[10px] text-gray-400">{s.category}</span>
                  {uniCount>0&&<span className="text-[10px] text-orange-600 font-medium">{uniCount}개 대학 권장</span>}
                </div>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{s.description}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {s.targetGrades.map((tg:string)=>(<span key={tg} className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${tg.includes('2026')?'bg-blue-100 text-blue-600':'bg-emerald-100 text-emerald-600'}`}>{tg}</span>))}
                </div>
              </button>
            )})}
          </div>
          {filtered.length===0&&<div className="text-center py-16 text-gray-400"><p>검색 결과가 없습니다</p></div>}
        </>)}

        {tab==='진로별 추천'&&(
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1">
              <h2 className="text-sm font-semibold text-gray-900 mb-3">진로 계열 선택</h2>
              <div className="space-y-1.5">{careerFields.map(c=>(<button key={c.id} onClick={()=>setCareer(c.id)} className={`w-full text-left px-4 py-3 rounded-lg text-sm font-medium transition-colors ${career===c.id?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{c.name} <span className="text-xs opacity-70">({c.desc})</span></button>))}</div>
            </div>
            <div className="lg:col-span-3">
              <h2 className="text-sm font-semibold text-gray-900 mb-1">{careerFields.find(c=>c.id===career)?.name} 계열 추천 과목</h2>
              <p className="text-xs text-gray-500 mb-4">{Object.keys(uniData).length}개 대학 권장과목 데이터 기반 (2028학년도 대교협)</p>
              {careerSubjects.length>0?(
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
                  {careerSubjects.map(s=>{const colors=gc(s.subjectGroup);return(
                    <button key={s.id} onClick={()=>setModal(s)} className={`text-left p-4 rounded-lg border ${colors.border} ${colors.bg} hover:shadow-md transition-shadow`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className={`font-semibold text-sm ${colors.text}`}>{s.name}</h3>
                        <span className={`shrink-0 px-1.5 py-0.5 text-[10px] font-medium rounded ${typeLabels[s.type]?.color}`}>{typeLabels[s.type]?.label}</span>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-2">{s.description}</p>
                    </button>
                  )})}
                </div>
              ):<div className="text-center py-12 text-gray-400">추천 과목이 없습니다.</div>}
            </div>
          </div>
        )}

        {tab==='대학별 권장'&&(
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <div className="relative mb-3">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
                <input type="text" placeholder="대학명 검색..." value={uniSearch} onChange={e=>setUniSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
              </div>
              <div className="space-y-1 max-h-[60vh] overflow-y-auto">{filteredUnis.map(u=>(<button key={u} onClick={()=>setSelUni(u)} className={`w-full text-left px-3 py-2.5 rounded-lg text-sm transition-colors ${selUni===u?'bg-blue-600 text-white':'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'}`}>{u} <span className="text-xs opacity-60">({Object.keys(uniData[u].fields).length})</span></button>))}</div>
            </div>
            <div className="lg:col-span-2">
              {selUni&&uniData[selUni]?(<>
                <h2 className="text-lg font-bold text-gray-900 mb-1">{selUni}</h2>
                <p className="text-xs text-gray-500 mb-4">2028학년도 권장과목 (대교협 기준)</p>
                <div className="space-y-4">
                  {Object.entries(uniData[selUni].fields).filter(([,v])=>v.ourSubjects.length>0).map(([fk,fv])=>(
                    <div key={fk} className="bg-white rounded-lg border border-gray-200 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">{fv.category}</span>
                        <h3 className="font-semibold text-sm text-gray-900">{fv.major}</h3>
                      </div>
                      <div className="mb-2">
                        <p className="text-xs text-gray-500 mb-1">권장 영역</p>
                        <div className="flex flex-wrap gap-1">{fv.recommendedAreas.map(a=>(<span key={a} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-[10px] rounded">{a}</span>))}</div>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 mb-1">우리 학교 해당 과목</p>
                        <div className="flex flex-wrap gap-1.5">{fv.ourSubjects.map(subj=>{const s=subjects.find(ss=>ss.name===subj);const colors=s?gc(s.subjectGroup):{badge:'bg-gray-100',text:'text-gray-600'};return(<button key={subj} onClick={()=>{const f=subjects.find(ss=>ss.name===subj);if(f)setModal(f)}} className={`px-2 py-1 text-xs rounded-md font-medium ${colors.badge} ${colors.text} hover:opacity-80`}>{subj}</button>)})}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>):(<div className="text-center py-16 text-gray-400"><p className="text-lg mb-2">왼쪽에서 대학을 선택하세요</p><p className="text-sm">{Object.keys(uniData).length}개 대학 권장과목 정보 제공</p></div>)}
            </div>
          </div>
        )}

        {tab==='AI 상담'&&(
          <div className="max-w-3xl mx-auto">
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden" style={{height:'calc(100vh - 200px)'}}>
              <div className="overflow-y-auto p-4 space-y-4" style={{height:'calc(100% - 72px)'}}>
                {msgs.length===0&&(
                  <div className="text-center py-12">
                    <p className="text-lg font-semibold text-gray-900 mb-2">과목 선택 상담 챗봇</p>
                    <p className="text-sm text-gray-500 mb-6">{subjects.length}개 과목 + {Object.keys(uniData).length}개 대학 권장과목 기반</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-md mx-auto">
                      {['의사가 되려면 어떤 과목?','서울대 권장과목 알려줘','전남대 권장과목','기하 설명해줘','2학년 과목 알려줘','컴퓨터공학과 가려면?'].map(q=>(<button key={q} onClick={()=>setChatIn(q)} className="text-left px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-600">{q}</button>))}
                    </div>
                  </div>
                )}
                {msgs.map((m,i)=>(<div key={i} className={`flex ${m.role==='user'?'justify-end':'justify-start'}`}><div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${m.role==='user'?'bg-blue-600 text-white rounded-br-md':'bg-gray-100 text-gray-900 rounded-bl-md'}`}><pre className="whitespace-pre-wrap font-sans">{m.content}</pre></div></div>))}
                {loading&&(<div className="flex justify-start"><div className="bg-gray-100 px-4 py-3 rounded-2xl rounded-bl-md"><div className="flex gap-1.5 items-center"><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.15s'}}/><span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.3s'}}/></div></div></div>)}
                <div ref={chatEnd}/>
              </div>
              <div className="border-t border-gray-200 p-4">
                <div className="flex gap-2">
                  <input type="text" value={chatIn} onChange={e=>setChatIn(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();handleChat()}}} placeholder="과목, 진로, 대학에 대해 질문해 보세요..." className="flex-1 px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"/>
                  <button onClick={handleChat} disabled={!chatIn.trim()||loading} className="px-4 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50">전송</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {modal&&(
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4" onClick={()=>setModal(null)}>
          <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl max-h-[85vh] overflow-y-auto" onClick={e=>e.stopPropagation()}>
            <div className={`p-5 border-b ${gc(modal.subjectGroup).bg}`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`px-2 py-0.5 text-xs font-medium rounded ${typeLabels[modal.type]?.color}`}>{typeLabels[modal.type]?.label}</span>
                    <span className={`px-2 py-0.5 text-xs rounded ${gc(modal.subjectGroup).badge} ${gc(modal.subjectGroup).text}`}>{modal.subjectGroup}</span>
                    <span className="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-600">{modal.category}</span>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">{modal.name}</h2>
                </div>
                <button onClick={()=>setModal(null)} className="p-1 hover:bg-gray-200 rounded-md"><svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12"/></svg></button>
              </div>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">운영 학점</p><p className="text-lg font-bold">{modal.opCredit}</p></div>
                <div className="text-center p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500 mb-1">기준 학점</p><p className="text-lg font-bold">{modal.baseCredit}</p></div>
              </div>
              {modal.semesters.length>0&&(<div><h3 className="text-sm font-semibold text-gray-900 mb-2">이수 시기</h3><div className="flex flex-wrap gap-2">{modal.semesters.map((sem:string)=>(<span key={sem} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-sm rounded-md font-medium">{sem.replace('-','학년 ')}학기</span>))}</div>{modal.selectionGroup&&<p className="text-xs text-gray-500 mt-2">선택 조건: {modal.selectionGroup}</p>}</div>)}
              {modal.targetGrades.length>0&&(<div><h3 className="text-sm font-semibold text-gray-900 mb-2">적용 학년</h3><div className="flex flex-wrap gap-2">{modal.targetGrades.map((tg:string,i:number)=>(<span key={i} className={`px-3 py-1.5 text-sm rounded-md font-medium ${tg.includes('2026')?'bg-blue-50 text-blue-700':'bg-emerald-50 text-emerald-700'}`}>{tg}</span>))}</div></div>)}
              <div><h3 className="text-sm font-semibold text-gray-900 mb-2">과목 소개</h3><p className="text-sm text-gray-600 leading-relaxed">{modal.description}</p></div>
              {modal.relatedMajors&&<div><h3 className="text-sm font-semibold text-gray-900 mb-2">관련 학과</h3><div className="flex flex-wrap gap-1.5">{modal.relatedMajors.split(',').map((m:string,i:number)=>(<span key={i} className="px-2 py-1 bg-violet-50 text-violet-700 text-xs rounded-md">{m.trim()}</span>))}</div></div>}
              {modal.relatedJobs&&<div><h3 className="text-sm font-semibold text-gray-900 mb-2">관련 직업</h3><div className="flex flex-wrap gap-1.5">{modal.relatedJobs.split(',').map((j:string,i:number)=>(<span key={i} className="px-2 py-1 bg-emerald-50 text-emerald-700 text-xs rounded-md">{j.trim()}</span>))}</div></div>}
              {(modal.recommendingUniversities as UniRec[])?.length>0&&(<div>
                <h3 className="text-sm font-semibold text-gray-900 mb-2">이 과목을 권장하는 대학</h3>
                <p className="text-xs text-gray-500 mb-2">2028학년도 대교협 기준</p>
                {(()=>{const byField:Record<string,string[]>={};for(const r of(modal.recommendingUniversities as UniRec[])){if(!byField[r.field])byField[r.field]=[];if(!byField[r.field].includes(r.university))byField[r.field].push(r.university)}return Object.entries(byField).map(([field,unis])=>(<div key={field} className="mb-2"><p className="text-xs font-medium text-orange-700 mb-1">{field}</p><div className="flex flex-wrap gap-1">{unis.map(u=>(<span key={u} className="px-2 py-0.5 bg-orange-50 text-orange-700 text-[10px] rounded">{u}</span>))}</div></div>))})()}
              </div>)}
            </div>
          </div>
        </div>
      )}

      <footer className="border-t border-gray-200 mt-12 py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
          <p>순천팔마고등학교 교육과정부</p>
          <p className="mt-1">2022 개정 교육과정 | 대학 권장과목: 2028학년도 대교협 자료</p>
        </div>
      </footer>
    </div>
  )
}
