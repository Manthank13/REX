export interface OpenMRPProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  mrp: number;
}

const mockExternalData: OpenMRPProduct[] = [
  { id: 'MRP-001', name: 'Raspberry Pi 4', brand: 'Raspberry Pi', category: 'Electronics', mrp: 4500 },
  { id: 'MRP-002', name: 'Arduino Uno', brand: 'Arduino', category: 'Electronics', mrp: 1200 },
  { id: 'MRP-003', name: 'fx-991ES PLUS', brand: 'Casio', category: 'Calculators', mrp: 950 },
  { id: 'MRP-004', name: 'Database Management Systems', brand: 'McGraw Hill', category: 'Books', mrp: 650 }
];

export async function fetchProductMetadata(query: string): Promise<OpenMRPProduct[]> {
  // Simulate network delay
  await new Promise(r => setTimeout(r, 500));
  
  const q = query.toLowerCase();
  return mockExternalData.filter(p => 
    p.name.toLowerCase().includes(q) || 
    p.brand.toLowerCase().includes(q) || 
    p.category.toLowerCase().includes(q)
  );
}
