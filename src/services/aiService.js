// Service to interface with Google Gemini API and provide high-quality fallback Mock plans

const getApiKey = () => {
  return localStorage.getItem('gemini_api_key') || '';
};

// Direct fetch handler for Gemini API to minimize external dependencies and secure client-side execution
async function callGemini(prompt, systemInstruction = '') {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('API_KEY_MISSING');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  const payload = {
    contents: [
      {
        parts: [
          { text: prompt }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.3,
      maxOutputTokens: 1000,
    }
  };

  if (systemInstruction) {
    payload.systemInstruction = {
      parts: [{ text: systemInstruction }]
    };
  }

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.error?.message || 'Gemini API call failed');
  }

  const data = await response.json();
  const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!outputText) {
    throw new Error('Empty response from GenAI model');
  }

  return outputText;
}

export const aiService = {
  hasKey() {
    return !!getApiKey();
  },

  setKey(key) {
    localStorage.setItem('gemini_api_key', key.trim());
  },

  clearKey() {
    localStorage.removeItem('gemini_api_key');
  },

  // Generates customized family safety plan
  async generatePreparednessPlan({ city, familyCount, specialNeeds, residenceType, vehicle, weatherData, langCode = 'en' }) {
    const languageNames = {
      en: 'English', hi: 'Hindi (हिंदी)', bn: 'Bengali (বাংলা)',
      mr: 'Marathi (मराठी)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', gu: 'Gujarati (ગુજરાતી)'
    };
    const targetLang = languageNames[langCode] || 'English';

    const specialNeedsStr = Object.entries(specialNeeds)
      .filter(([_, checked]) => checked)
      .map(([key]) => key)
      .join(', ') || 'None';

    const prompt = `
      Create a detailed, highly personalized, action-oriented Monsoon Safety and Preparedness Plan for a household.
      
      Household details:
      - Location (City): ${city}
      - Family Size: ${familyCount} members
      - Vulnerable Members (Elderly, Infants, Pets, Specially Abled): ${specialNeedsStr}
      - Type of Home: ${residenceType}
      - Transit Vehicles Owned: ${vehicle}
      - Current Monsoon Weather State at Location: Temp ${weatherData.temp}°C, Hourly Rain ${weatherData.rain}mm, Daily Rain Sum ${weatherData.dailyRainSum}mm, Flood Risk Index ${weatherData.floodRiskIndex}/10, Active alerts: ${weatherData.alerts.join(', ')}

      The response MUST be formatted in clean Markdown with distinct headers.
      Structure the response as follows:
      1. **Situation Summary**: Briefly assess current weather threats for the city and their impact on this specific household type.
      2. **Pre-Storm Precautions**: Immediate structural, logistical, and emergency stock actions. Focus on vulnerabilities (e.g., ground floor flooding, kutcha house evacuation, baby food, elderly meds).
      3. **During Torrential Rain Protocol**: Actionable safety drills (e.g., electrical disconnects, pet safety, vehicle anchoring, vertical evacuation if ground floor).
      4. **Post-Flood Safety & Recovery**: Guidance on sanitizing water, inspecting electrical systems, and avoiding infections.
      
      CRITICAL: Write the entire plan response ONLY in ${targetLang}. Use simple, clear, and reassuring language suitable for a common citizen.
    `;

    const systemInstruction = "You are a professional Disaster Management Planner and GenAI Safety Assistant. Output practical, structured, locally relevant advice in markdown.";

    try {
      return await callGemini(prompt, systemInstruction);
    } catch (error) {
      console.warn('Using local rule-based AI engine for Preparedness Plan:', error.message);
      return this.mockGeneratePreparednessPlan({ city, familyCount, specialNeeds, residenceType, vehicle, weatherData, langCode });
    }
  },

  // Generates travel hazards and safety routes advisories
  async generateTravelAdvisory({ source, destination, travelMode, weatherData, langCode = 'en' }) {
    const languageNames = {
      en: 'English', hi: 'Hindi (हिंदी)', bn: 'Bengali (বাংলা)',
      mr: 'Marathi (मराठी)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', gu: 'Gujarati (ગુજરાતી)'
    };
    const targetLang = languageNames[langCode] || 'English';

    const prompt = `
      Provide a weather-aware travel safety advisory and routing guidelines.
      
      Trip Details:
      - Starting Area: ${source}
      - Destination Area: ${destination}
      - Mode of Transit: ${travelMode}
      - Current Local City Weather: ${weatherData.city} (Flood Risk Index: ${weatherData.floodRiskIndex}/10, Rain Intensity: ${weatherData.rain}mm/h, Alerts: ${weatherData.alerts.join(', ')})
      - Waterlogging Hotspots in this City: ${weatherData.hotspots.join(', ')}

      The response MUST be in clean Markdown.
      Structure it as follows:
      1. **Safety Rating**: Assign a safety rating out of 10 (10 = fully safe, 1 = dangerous) and justify it.
      2. **Transit-Specific Hazards**: What risks does this specific travel mode face (e.g., open manholes for walking, skidding for two-wheelers, hydroplaning and underpass floods for cars)?
      3. **Critical Recommendations**: Step-by-step route checks, alternate safety tips, and what signs of waterlogging to avoid.
      
      CRITICAL: Write the entire response ONLY in ${targetLang}. Keep it short, actionable, and easy to read.
    `;

    try {
      return await callGemini(prompt, "You are a Monsoon Travel Risk Analyst. Provide safety guidelines based on transit modes and flooding states.");
    } catch (error) {
      console.warn('Using local rule-based AI engine for Travel Advisory:', error.message);
      return this.mockGenerateTravelAdvisory({ source, destination, travelMode, weatherData, langCode });
    }
  },

  // Interactive AI Safety chatbot
  async askSafetyQuestion({ question, weatherData, langCode = 'en' }) {
    const languageNames = {
      en: 'English', hi: 'Hindi (हिंदी)', bn: 'Bengali (বাংলা)',
      mr: 'Marathi (मराठी)', ta: 'Tamil (தமிழ்)', te: 'Telugu (తెలుగు)', gu: 'Gujarati (ગુજરાતી)'
    };
    const targetLang = languageNames[langCode] || 'English';

    const prompt = `
      Answer the citizen query regarding monsoon safety, first aid, or health precautions.
      
      Current weather context in ${weatherData.city}: Flood Risk ${weatherData.floodRiskIndex}/10, Rain ${weatherData.rain}mm/h.
      Citizen Question: "${question}"

      Guidelines:
      - Answer in clean Markdown, keeping it to 2-3 short, highly readable paragraphs or bullet points.
      - Focus heavily on safety, medical first-aid basics, and hazard prevention (avoiding contaminated water, electrocution, snake bites, leptospirosis, malaria).
      - If it is a medical emergency, emphasize calling the helpline immediately.
      
      CRITICAL: Write the entire response ONLY in ${targetLang}.
    `;

    try {
      return await callGemini(prompt, "You are a first-aid and medical safety advisor specializing in monsoon hazards. Output responses in markdown.");
    } catch (error) {
      console.warn('Using local rule-based AI engine for Safety Bot:', error.message);
      return this.mockAskSafetyQuestion({ question, weatherData, langCode });
    }
  },

  // ----------------------------------------------------
  // Mock GenAI Rule Engines (Dynamic Multi-lingual fallback)
  // ----------------------------------------------------

  mockGeneratePreparednessPlan({ city, familyCount, specialNeeds, residenceType, vehicle, weatherData, langCode }) {
    // Basic translation keys for Mock AI blueprint based on selected language
    const dict = {
      en: {
        title: `## Custom Monsoon Safety Plan: ${city}`,
        risk: `**Household Threat Assessment (Risk Index: ${weatherData.floodRiskIndex}/10)**`,
        riskLevel: weatherData.floodRiskIndex > 6 ? '🔴 HIGH RISK' : (weatherData.floodRiskIndex > 3 ? '🟡 MODERATE RISK' : '🟢 LOW RISK'),
        household: `### 1. Household Profile & Focus Areas
- **Family size**: ${familyCount} persons.
- **Home Type**: ${residenceType === 'groundFloor' ? 'Ground floor (Flooding/Drain overflow risk)' : (residenceType === 'slumKutcha' ? 'Kutcha shelter (Structural collapse/Evacuation priority)' : 'Upper floor (High winds & electricity cuts risk)')}.
- **Transit vehicle**: ${vehicle === 'twoWheeler' ? 'Two-wheeler (highly unstable on flooded roadways)' : (vehicle === 'fourWheeler' ? 'Four-wheeler (engine choking/underpass hazard)' : 'No personal vehicle')}.`,
        vuln: `\n- **Vulnerable members care**: ${Object.entries(specialNeeds).filter(([_, v]) => v).map(([k]) => k).join(', ') || 'None. Keep standard first aid kit ready.'}`,
        steps: `### 2. Phase-wise Action Protocol

#### Before the heavy rain hits:
- **Clean out drains**: Ensure localized drains in your house premises are clear of plastic/leaves.
- **Elevate items**: Move documents, electronics, and valuable appliances to shelves at least 3 feet high.
- **Emergency supplies**: Store 15 liters of drinking water per person and baby food/pet food if needed.
- **Charge power banks**: Keep mobile phones fully charged; power grids often trip during downpours.

#### During the thunderstorm:
- **Cut off mains**: If water enters your house, turn off the main circuit breaker (MCB) immediately to prevent shock.
- **Stay indoors**: Do not stand on balconies, near windows, or touch metal pipes.
- **Anchor vehicle**: Park vehicle on higher ground away from trees or weak brick walls.

#### After the weather clears:
- **Sanitize water**: Boil all drinking water or use chlorine pills. Leptospira and cholera spread rapidly in floodwater.
- **Inspect electrical wires**: Do not switch on wet appliances. Let them dry for 24 hours.`,
      },
      hi: {
        title: `## कस्टम मानसून सुरक्षा योजना: ${city}`,
        risk: `**घरेलू खतरा मूल्यांकन (जोखिम सूचकांक: ${weatherData.floodRiskIndex}/10)**`,
        riskLevel: weatherData.floodRiskIndex > 6 ? '🔴 उच्च जोखिम' : (weatherData.floodRiskIndex > 3 ? '🟡 मध्यम जोखिम' : '🟢 कम जोखिम'),
        household: `### 1. घरेलू विवरण और ध्यान देने योग्य क्षेत्र
- **परिवार का आकार**: ${familyCount} सदस्य।
- **घर का प्रकार**: ${residenceType === 'groundFloor' ? 'ग्राउंड फ्लोर (बाढ़/नाली ओवरफ्लो का खतरा)' : (residenceType === 'slumKutcha' ? 'कच्चा घर (संरचनात्मक क्षति/निकासी प्राथमिकता)' : 'ऊपरी मंजिल (तेज हवा और बिजली कटौती का खतरा)')}।
- **वाहन**: ${vehicle === 'twoWheeler' ? 'दोपहिया वाहन (पानी भरे रास्तों पर फिसलने का भारी खतरा)' : (vehicle === 'fourWheeler' ? 'चौपहिया वाहन (इंजन चोक होने/अंडरपास में फंसने का खतरा)' : 'कोई वाहन नहीं')}।`,
        vuln: `\n- **अति संवेदनशील सदस्यों की देखभाल**: ${Object.entries(specialNeeds).filter(([_, v]) => v).map(([k]) => k === 'elderly' ? 'बुजुर्ग' : k === 'infants' ? 'शिशु' : k === 'pets' ? 'पालतू जानवर' : 'दिव्यांग').join(', ') || 'कोई नहीं। आपातकालीन दवाएं तैयार रखें।'}`,
        steps: `### 2. चरण-वार कार्य योजना

#### भारी बारिश से पहले:
- **नाली की सफाई**: सुनिश्चित करें कि घर के आसपास की नालियां कचरे से मुक्त हों।
- **सामान ऊपर उठाएं**: महत्वपूर्ण दस्तावेजों, इलेक्ट्रॉनिक्स और कीमती सामानों को कम से कम 3 फीट की ऊंचाई पर रखें।
- **आपातकालीन आपूर्ति**: प्रति व्यक्ति 15 लीटर पीने का पानी और बच्चों/पालतू जानवरों के लिए भोजन सुरक्षित रखें।
- **बिजली बैकअप**: मोबाइल फोन और पावर बैंक पूरी तरह से चार्ज रखें; बारिश के दौरान अक्सर बिजली चली जाती है।

#### आंधी और भारी बारिश के दौरान:
- **मुख्य पावर बंद करें**: यदि घर में पानी घुसता है, तो करंट से बचने के लिए तुरंत मुख्य बिजली स्विच (MCB) बंद कर दें।
- **अंदर रहें**: खिड़कियों के पास न खड़े हों, बालकनी से दूर रहें, और गीले बिजली के खंभों को न छुएं।
- **वाहन सुरक्षा**: वाहनों को पेड़ों और कमजोर दीवारों से दूर ऊंचे स्थानों पर पार्क करें।

#### बारिश रुकने के बाद:
- **पानी को कीटाणुरहित करें**: पीने के पानी को उबालें या क्लोरीन की गोलियों का उपयोग करें। बाढ़ के पानी में रोगजनक तेजी से फैलते हैं।
- **बिजली के उपकरणों की जांच**: गीले स्विचबोर्ड को तब तक न छुएं जब तक वे सूख न जाएं।`,
      }
    };

    // Fallback to English dictionary if selected language isn't fully pre-mapped in mockup
    const d = dict[langCode] || dict.en;

    const basePlan = `
${d.title}
${d.risk}: **${d.riskLevel}**
${d.household}
${d.vuln}
${d.steps}
    `;

    return Promise.resolve(basePlan.trim());
  },

  mockGenerateTravelAdvisory({ source, destination, travelMode, weatherData, langCode }) {
    // Generate route safety rating based on rainfall intensity
    let score = 9;
    if (weatherData.floodRiskIndex > 7) {
      score = 2;
    } else if (weatherData.floodRiskIndex > 4) {
      score = 5;
    }

    const ratingsText = {
      en: {
        header: `### Route Safety Evaluation: ${source} to ${destination}`,
        rating: `**Safety Index: ${score}/10** (${score <= 3 ? '🔴 TRAVEL NOT RECOMMENDED' : (score <= 6 ? '🟡 EXERCISE EXTREME CAUTION' : '🟢 GENERALLY SAFE')})`,
        hazards: `#### Transit Risks (${travelMode.toUpperCase()}):`,
        hList: travelMode === 'twoWheeler' 
          ? `- **Aquaplaning risk**: High chance of two-wheelers skidding on oil-slicked and water-covered roads.\n- **Pothole hazards**: Hidden potholes under turbid muddy water can lead to severe accidents.\n- **Wind drift**: High gusts can knock down light vehicles.`
          : travelMode === 'fourWheeler'
          ? `- **Underpass engine choke**: Avoid Underpasses! Water level above 1 foot will clog exhaust pipes and stall cars.\n- **Traffic gridlock**: Heavy rain triggers city-wide traffic due to sewer backs.\n- **Braking efficiency**: Wet disc brakes take double the time to bring vehicles to a stop.`
          : `- **Open sewers and manholes**: Walking in knee-deep water is dangerous. Open manholes are invisible.\n- **Electrocution risk**: Stray cables and transformers submerged in water can conduct lethal current.\n- **Debris**: Sharp metal and glass hidden in flooded streets.`,
        tips: `#### Route Advice:
1. **Check local maps**: Check for reported waterlogging hotspots: *${weatherData.hotspots.slice(0, 3).join(', ')}*.
2. **Drive in Low Gear**: If navigating light water, maintain steady acceleration in first/second gear to keep exhaust pressure up.
3. **Emergency Numbers**: Keep road-side assistance numbers handy. Turn off air-conditioner if water levels rise to grille height.`
      },
      hi: {
        header: `### यात्रा मार्ग सुरक्षा मूल्यांकन: ${source} से ${destination}`,
        rating: `**सुरक्षा सूचकांक: ${score}/10** (${score <= 3 ? '🔴 यात्रा करने से बचें' : (score <= 6 ? '🟡 अत्यधिक सावधानी बरतें' : '🟢 सामान्यतः सुरक्षित')})`,
        hazards: `#### पारगमन जोखिम (${travelMode === 'twoWheeler' ? 'दोपहिया' : travelMode === 'fourWheeler' ? 'चारपहिया' : 'पैदल'}):`,
        hList: travelMode === 'twoWheeler'
          ? `- **फिसलन का खतरा**: तेलयुक्त और पानी से भरी सड़कों पर दोपहिया वाहनों के फिसलने की अधिक संभावना।\n- **छिपे हुए गड्ढे**: मटमैले पानी के नीचे गड्ढे दिखाई नहीं देते, जो गंभीर दुर्घटनाओं का कारण बन सकते हैं।\n- **तेज हवा**: तेज हवाओं के झोंके दोपहिया वाहनों का संतुलन बिगाड़ सकते हैं।`
          : travelMode === 'fourWheeler'
          ? `- **अंडरपास में इंजन चोक**: अंडरपास से बचें! 1 फीट से अधिक पानी होने पर कार साइलेंसर ब्लॉक हो जाता है।\n- **यातायात जाम**: भारी बारिश के कारण प्रमुख जलभराव बिंदुओं पर ट्रैफिक जाम की समस्या।\n- **ब्रेकिंग दूरी**: गीली सड़कों पर ब्रेक लगाने में सामान्य से दोगुना समय लगता है।`
          : `- **खुले मैनहोल**: घुटने तक भरे पानी में चलना खतरनाक है क्योंकि खुले मैनहोल दिखाई नहीं देते।\n- **करंट लगने का खतरा**: बिजली के खंभों, ट्रांसफार्मर और लटकते तारों से दूर रहें; पानी करंट फैला सकता है।`,
        tips: `#### मार्ग सलाह:
1. **जलभराव बिंदुओं से बचें**: इन संवेदनशील क्षेत्रों में जाने से बचें: *${weatherData.hotspots.slice(0, 3).join(', ')}*।
2. **लो गियर में चलाएं**: पानी भरे मार्ग को पार करते समय कार को फर्स्ट या सेकंड गियर में रखें और एक्सीलेटर न छोड़ें।
3. **हेल्पलाइन नंबर**: हाईवे और स्थानीय आपदा प्रबंधन के हेल्पलाइन नंबर सहेज कर रखें।`
      }
    };

    const r = ratingsText[langCode] || ratingsText.en;
    const body = `
${r.header}
${r.rating}
${r.hazards}
${r.hList}
${r.tips}
    `;

    return Promise.resolve(body.trim());
  },

  mockAskSafetyQuestion({ question, weatherData, langCode }) {
    const q = question.toLowerCase();
    
    // Safety bot multi-lingual knowledge base
    const db = {
      en: {
        electrical: `### Electrical Safety During Monsoon ⚡
1. **Do not touch electrical poles**: Wet concrete and steel poles are notorious for grounding currents during monsoons. Keep a distance of at least 5 meters.
2. **Unplug indoor electronics**: Heavy lightning storms generate power surges. Unplug computers, routers, and televisions.
3. **Wet Hands Warning**: Never switch on electrical appliances while standing barefoot on wet floors.
4. **Submerged outlets**: If water reaches power outlets, isolate that zone from your fuse box immediately.`,
        snake: `### First Aid for Snake Bites 🐍
*During monsoons, snakes seek higher dry ground, increasing human encounters.*
1. **Keep calm and still**: Movement speeds up the circulation of venom.
2. **DO NOT cut or suck the bite**: This is a dangerous myth that spreads infection and worsens tissues.
3. **Immobilize the limb**: Apply a clean splint or loose bandage. Keep the bitten area below the level of the heart.
4. **Rush to Hospital**: Antivenom (ASV) is the only cure. Note the snake's color/pattern if possible to help doctors identify it.`,
        health: `### Waterborne Illness Prevention 💧
1. **Boil Drinking Water**: Floodwater regularly contaminates municipal water pipelines. Boil water for at least 10 minutes.
2. **Wash legs and hands**: If you walk through rainwater, wash thoroughly with soap. Leptospirosis bacteria enters through minor cuts on the skin.
3. **Control breeding**: Empty standing fresh water in coolers, tires, and pots to prevent Dengue and Malaria mosquitoes.
4. **Food hygiene**: Avoid eating raw street food or exposed snacks during monsoons.`,
        default: `### Monsoon Safety Advisory 🌧️
- **Keep dry**: Prolonged exposure to wet clothes triggers lung infections and fungal skin rashes.
- **Emergency supplies**: Keep dry foods (biscuits, parched rice) and a fresh medical kit containing rehydration salts (ORS), band-aids, and antiseptic creams.
- **Listen to weather bulletins**: Do not venture out if regional disaster warnings (Orange/Red alerts) are announced. Keep contact info of the nearest municipality ready.`
      },
      hi: {
        electrical: `### मानसून के दौरान बिजली सुरक्षा ⚡
1. **बिजली के खंभों को न छुएं**: बारिश में गीले कंक्रीट और लोहे के खंभों में करंट उतरने का बहुत अधिक खतरा होता है। इनसे कम से कम 5 मीटर की दूरी रखें।
2. **उपकरणों को अनप्लग करें**: बिजली कड़कने के दौरान वोल्टेज सर्ज से टीवी, कंप्यूटर और राउटर खराब हो सकते हैं।
3. **गीले हाथों से बचें**: कभी भी नंगे पैर गीली सतह पर खड़े होकर स्विच बोर्ड को न छुएं।
4. **एमसीबी बंद करें**: यदि पानी घर के स्विच स्तर तक आ जाता है, तो मेन पावर ग्रिड स्विच को तुरंत बंद करें।`,
        snake: `### सांप काटने पर प्राथमिक उपचार 🐍
*चोमासे में पानी भरने के कारण सांप सूखे स्थानों की तलाश में बाहर निकलते हैं।*
1. **शांत रहें और हिलें-डुलें नहीं**: अधिक हिलने-डुलने से जहर शरीर में तेजी से फैलता है।
2. **काटने की जगह को न काटें या चूसें**: यह एक खतरनाक मिथक है। घाव को दबाएं नहीं और न ही उस पर चीरा लगाएं।
3. **अंग को स्थिर रखें**: घाव को साफ कपड़े से बांधें। प्रभावित अंग को हृदय के स्तर से नीचे रखें।
4. **अस्पताल जाएं**: सरकारी अस्पतालों में एंटी-वेनम (ASV) उपलब्ध होता है। झाड़-फूंक में समय बर्बाद न करें।`,
        health: `### जलजनित बीमारियों से बचाव 💧
1. **पानी उबालकर पिएं**: बाढ़ का पानी पीने की पाइपलाइनों को दूषित कर देता है। पीने के पानी को कम से कम 10 मिनट तक उबालें।
2. **पैरों को धोएं**: यदि आप बारिश के पानी में चले हैं, तो पैरों को साबुन से अच्छी तरह धोएं। लेप्टोस्पायरोसिस बैक्टीरिया पैर के घावों के जरिए शरीर में प्रवेश करता है।
3. **मच्छरों से बचाव**: कूलरों, पुराने टायरों और गमलों में पानी जमा न होने दें ताकि डेंगू और मलेरिया से बचा जा सके।
4. **ताजा भोजन खाएं**: बाहर के खुले भोजन या सड़क किनारे के चाट-पकौड़े खाने से बचें।`,
        default: `### मानसून सामान्य सुरक्षा सलाह 🌧️
- **सूखा रहें**: गीले कपड़ों में लंबे समय तक रहने से छाती में संक्रमण और त्वचा पर फंगल रैश हो सकते हैं।
- **आपातकालीन सामग्री**: ओआरएस पैकेट, प्राथमिक चिकित्सा किट, टॉर्च और कुछ सूखा भोजन (बिस्कुट, चूरा) हमेशा तैयार रखें।
- **मौसम की खबरों पर नजर रखें**: रेड अलर्ट की स्थिति में घर से बाहर बिल्कुल न निकलें।`
      }
    };

    const lang = db[langCode] ? langCode : 'en';
    let ans = db[lang].default;

    if (q.includes('shock') || q.includes('electric') || q.includes('power') || q.includes('तार') || q.includes('बिजली')) {
      ans = db[lang].electrical;
    } else if (q.includes('snake') || q.includes('bite') || q.includes('सांप') || q.includes('काट')) {
      ans = db[lang].snake;
    } else if (q.includes('health') || q.includes('disease') || q.includes('water') || q.includes('food') || q.includes('बीमार') || q.includes('पानी')) {
      ans = db[lang].health;
    }

    return Promise.resolve(ans.trim());
  }
};
