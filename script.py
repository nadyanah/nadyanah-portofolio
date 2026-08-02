import re

with open('index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove Reservasi from Drawer
content = re.sub(r'(?s)\s*<button @click="switchTab\(\'reserve\'\)".*?Reservasi Sesi Chat.*?<\/button>', '', content)

# 2. Remove Reservasi from Bottom Nav
content = re.sub(r'(?s)\s*<button @click="switchTab\(\'reserve\'\)".*?title="Reservasi">.*?<\/button>', '', content)

# 3. Replace Profile Tab & Remove Reserve Tab completely
profile_replacement = '''
            <!-- CHEF PROFILE TAB (ATS CV Format) -->
            <div v-if="activeTab === 'chef'" class="bg-white p-8 md:p-14 shadow-lg max-w-4xl mx-auto text-left font-sans border-t-[6px] border-brand-charcoal">
              
              <!-- Header -->
              <div class="border-b-[1.5px] border-neutral-300 pb-5 mb-6 text-center md:text-left">
                <h1 class="text-3xl md:text-4xl font-bold text-brand-charcoal tracking-tight uppercase">{{chefProfileState.name}}</h1>
                <p class="text-lg text-neutral-600 mt-1 font-medium">{{chefProfileState.title}}</p>
                <div class="flex flex-wrap justify-center md:justify-start gap-x-4 gap-y-2 mt-4 text-sm text-neutral-500 font-medium">
                  <span class="flex items-center gap-1.5"><i data-lucide="briefcase" class="h-3.5 w-3.5"></i> {{chefProfileState.experienceYears}}</span>
                  <span class="hidden md:inline text-neutral-300">|</span>
                  <span class="flex items-center gap-1.5"><i data-lucide="map-pin" class="h-3.5 w-3.5"></i> Jakarta, Indonesia</span>
                  <span class="hidden md:inline text-neutral-300">|</span>
                  <span class="flex items-center gap-1.5"><i data-lucide="mail" class="h-3.5 w-3.5"></i> n.canva24@gmail.com</span>
                </div>
              </div>

              <!-- Professional Summary -->
              <div class="mb-8">
                <h2 class="text-sm font-bold text-brand-charcoal uppercase tracking-widest border-b-[1.5px] border-neutral-300 pb-2 mb-4">Professional Summary</h2>
                <p class="text-sm text-neutral-800 leading-relaxed text-justify">
                  {{chefProfileState.bio}}
                </p>
                <p class="text-sm text-neutral-600 leading-relaxed mt-4 italic pl-4 border-l-2 border-neutral-300">
                  "{{chefProfileState.philosophy}}"
                </p>
              </div>

              <!-- Core Competencies -->
              <div class="mb-8">
                <h2 class="text-sm font-bold text-brand-charcoal uppercase tracking-widest border-b-[1.5px] border-neutral-300 pb-2 mb-4">Core Competencies &amp; Specialties</h2>
                <ul class="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-2.5">
                  <li v-for="(spec, idx) in chefProfileState.specialties" :key="'spec'+idx" class="flex items-start gap-2.5 text-sm text-neutral-800">
                    <span class="text-brand-charcoal mt-1 text-[8px]">■</span>
                    <span>{{spec}}</span>
                  </li>
                </ul>
              </div>

              <!-- Professional Methodologies -->
              <div class="mb-4">
                <h2 class="text-sm font-bold text-brand-charcoal uppercase tracking-widest border-b-[1.5px] border-neutral-300 pb-2 mb-4">Professional Principles &amp; Methodologies</h2>
                <div class="space-y-4">
                  <div v-for="(princ, idx) in chefProfileState.kitchenPrinciples" :key="'princ'+idx" class="text-sm text-neutral-800">
                    <template v-if="princ.includes(': ')">
                      <div class="flex items-start gap-2.5">
                        <span class="text-brand-charcoal mt-1 text-[8px]">■</span>
                        <div class="leading-relaxed text-justify">
                          <span class="font-bold text-brand-charcoal">{{princ.split(': ')[0]}}: </span>
                          <span>{{princ.split(': ').slice(1).join(': ')}}</span>
                        </div>
                      </div>
                    </template>
                    <template v-else>
                      <div class="flex items-start gap-2.5">
                        <span class="text-brand-charcoal mt-1 text-[8px]">■</span>
                        <span class="font-bold leading-relaxed">{{princ}}</span>
                      </div>
                    </template>
                  </div>
                </div>
              </div>
            </div>
            
            <!-- GUESTBOOK TAB -->'''

content = re.sub(r'(?s)\s*<div v-if="activeTab === \'chef\'".*?<!-- GUESTBOOK TAB -->', profile_replacement, content)

# 4. Remove Guestbook Section Header
content = re.sub(r'(?s)<!-- Section Header -->.*?<!-- Two-column layout: side by side from md breakpoint -->', '<!-- Two-column layout: side by side from md breakpoint -->', content)

# 5. Change "Tulis Ulasan Anda" to "Buku Tamu"
content = content.replace('<h3 class="text-lg font-serif font-bold text-brand-charcoal leading-tight">Tulis Ulasan Anda</h3>', '<h3 class="text-lg font-serif font-bold text-brand-charcoal leading-tight">Buku Tamu</h3>')

with open('index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done modifying index.html')
