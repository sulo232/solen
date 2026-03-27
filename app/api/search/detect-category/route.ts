import { NextResponse } from 'next/server';

const CATEGORY_KEYWORDS = {
  barbershop: ['barber', 'fade', 'beard', 'bart', 'men', 'herren', 'haircut'],
  coiffeur: ['hair', 'salon', 'cut', 'color', 'balayage', 'haare', 'friseur'],
  nails: ['nail', 'manicure', 'pedicure', 'nägel', 'gel', 'acrylic'],
  spa: ['spa', 'facial', 'skin', 'gesicht', 'treatment', 'relax'],
  massage: ['massage', 'rub', 'therapy', 'therapie', 'back'],
  makeup: ['makeup', 'make-up', 'visage', 'kosmetik'],
  brows: ['brow', 'lash', 'augenbrauen', 'wimpern', 'tint'],
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || typeof query !== 'string') {
      return NextResponse.json({ category: null });
    }

    const normalizedQuery = query.toLowerCase().trim();
    
    // Simple keyword matching for AI category detection fallback
    for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
      if (keywords.some(keyword => normalizedQuery.includes(keyword))) {
        return NextResponse.json({ category });
      }
    }

    // Default or no match
    return NextResponse.json({ category: null });

  } catch (error) {
    console.error('Category detection error:', error);
    return NextResponse.json(
      { error: 'Failed to detect category' },
      { status: 500 }
    );
  }
}
