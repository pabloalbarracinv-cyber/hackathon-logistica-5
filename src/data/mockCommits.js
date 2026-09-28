export const mockCommitStream = [
  {
    id: 'cmt-101',
    teamId: 'T-01_BODEGA',
    teamName: 'T-01_BODEGA',
    file: 'src/warehouse/crossdocking_buffer.ts',
    message: 'feat: buffer de cross-docking con asignación dinámica de muelles de salida',
    scoreDelta: 4,
    tokenDelta: 450,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Algoritmo de consolidación de carga en muelle. Reduce tiempo de estancia en patio a 18 min.',
    codeSnippet: `// Sincronización de Muelles de Salida Cross-Docking
export class CrossDockingBuffer {
  private readyPallets: Map<string, PalletManifest>;
  
  getConsolidatedPallets(dockId: string): PalletManifest[] {
    return Array.from(this.readyPallets.values())
      .filter(p => p.dockId === dockId && p.status === 'READY_FOR_LOADING');
  }
}`,
    synergy: null
  },
  {
    id: 'cmt-102',
    teamId: 'T-07_RUTAS',
    teamName: 'T-07_RUTAS',
    file: 'services/fleet_load_dispatcher.js',
    message: 'feat: optimizador de cubicaje y cubic meters por tipo de tractocamión',
    scoreDelta: 6,
    tokenDelta: 620,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Cálculo 3D de aprovechamiento volumétrico de flota. Eficiencia de carga del 94.2%.',
    codeSnippet: `export function assignTruckPayload(pallets, fleetVehicles) {
  // Cubicaje automático según peso máximo y volumen
  return fleetVehicles.map(truck => {
    const assigned = pack3D(truck.volumeM3, truck.maxPayloadKg, pallets);
    return {
      truckId: truck.id,
      fillRatePct: assigned.volumeUsed / truck.volumeM3 * 100,
      manifest: assigned.pallets
    };
  });
}`,
    synergy: {
      teamA: 'T-01_BODEGA',
      teamB: 'T-07_RUTAS',
      moduleA: 'CrossDocking_Buffer',
      moduleB: 'Fleet_Dispatcher',
      description: 'Sinergia operativa: Los pallets listos en el muelle de Bodega se sincronizan en tiempo real con el planificador de cubicaje y despacho de Rutas sin almacenamiento intermedio.',
      voiceAlert: 'Alerta de Sinergia. El buffer de cross-docking de Bodega puede alimentar directamente el despachador de flota de Rutas para carga inmediata.'
    }
  },
  {
    id: 'cmt-103',
    teamId: 'T-04_ADUANAS',
    teamName: 'T-04_ADUANAS',
    file: 'api/customs/tariff_engine.py',
    message: 'feat: motor de liquidación arancelaria DIAN y gravámenes de importación',
    scoreDelta: 5,
    tokenDelta: 580,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Liquidación de arancel + IVA según subpartida arancelaria y acuerdos TLC.',
    codeSnippet: `def calculate_landed_duties(hs_code: str, fob_usd: float, origin: str) -> dict:
    rule = DIAN_RULES.get(hs_code, {"tariff": 0.15, "vat": 0.19})
    preferential = 0.0 if origin in TLC_PARTNERS else rule["tariff"]
    cif_usd = fob_usd * 1.08 # Flete + Seguro estimado
    duty_amount = cif_usd * preferential
    vat_amount = (cif_usd + duty_amount) * rule["vat"]
    return {"duty_usd": duty_amount, "vat_usd": vat_amount, "total_taxes": duty_amount + vat_amount}`,
    synergy: null
  },
  {
    id: 'cmt-104',
    teamId: 'T-02_COMPRAS',
    teamName: 'T-02_COMPRAS',
    file: 'src/procurement/landed_cost_calculator.py',
    message: 'feat: simulador de Costo Total de Adquisición (Landed Cost) para proveedores extranjeros',
    scoreDelta: 5,
    tokenDelta: 490,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Fórmula de costo integral. Permite comparar proveedores locales vs importación.',
    codeSnippet: `def evaluate_supplier_rfq(vendor_id: str, unit_price: float, hs_code: str) -> float:
    # Consulta liquidación de aduanas para obtener costo puesto en bodega
    taxes = customs_api.get_duties(hs_code, unit_price)
    total_landed_cost = unit_price + taxes["total_taxes"] + LOCAL_FREIGHT
    return total_landed_cost`,
    synergy: {
      teamA: 'T-04_ADUANAS',
      teamB: 'T-02_COMPRAS',
      moduleA: 'Tariff_Engine',
      moduleB: 'Landed_Cost_Calculator',
      description: 'Sinergia financiera: El cotizador de Compras consume en tiempo real la liquidación de tributos de Aduanas para obtener el costo total de importación antes de emitir la orden.',
      voiceAlert: 'Nueva sinergia detectada. El módulo de compras internacionales puede consumir directamente el motor de liquidación arancelaria de Aduanas.'
    }
  },
  {
    id: 'cmt-105',
    teamId: 'T-07_RUTAS',
    teamName: 'T-07_RUTAS',
    file: 'services/dijkstra_multimodal.js',
    message: 'refactor: ruteo multi-modal puerto-bodega con optimización de combustible',
    scoreDelta: 4,
    tokenDelta: 510,
    commitCount: 1,
    status: 'OPTIMAL',
    aiAnalysis: 'Ruta optimizada con 18% menos emisiones de CO2 y ahorro de peajes.',
    codeSnippet: `export function getMultimodalRoute(origin, destination) {
  const corridors = RouteCorridors.getApprovedFreightPaths();
  return dijkstra(corridors, origin, destination, { optimizeFor: 'COST_AND_TIME' });
}`,
    synergy: null
  }
];
