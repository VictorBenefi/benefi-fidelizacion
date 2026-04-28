export default function AdminHome() {
  return (
    <div className="p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-4xl font-bold text-slate-900">Backoffice BENEFI</h1>
          <p className="mt-2 text-base leading-7 text-slate-600">
            Seleccioná un módulo del menú para administrar campañas,
            configuraciones y herramientas del sistema.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <a
              href="/admin/campanias"
              className="rounded-xl bg-blue-600 px-5 py-3 text-base font-medium text-white transition hover:bg-blue-700"
            >
              + Nueva campaña
            </a>

            <a
              href="/admin/comercios"
              className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-base font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Administrar comercios
            </a>

            
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-500">Campañas activas</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">2</div>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Campañas white-label listas para asignar a comercios.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-500">Comercios</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">1</div>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Comercios dados de alta dentro del ecosistema BENEFI.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-500">Notificaciones enviadas</div>
            <div className="mt-2 text-4xl font-bold text-slate-900">2</div>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Comunicaciones enviadas recientemente a usuarios.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-500">Módulo activo</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">Campañas</div>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Gestioná branding, colores, logos y configuraciones white-label.
            </p>

            <a
              href="/admin/campanias"
              className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ir a campañas
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-500">Próximo módulo</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">Comercios</div>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Alta, edición y seguimiento de comercios dentro del ecosistema.
            </p>

            <a
              href="/admin/comercios"
              className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ir a comercios
            </a>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="text-base font-medium text-slate-500">Escalabilidad</div>
            <div className="mt-2 text-3xl font-bold text-slate-900">White-label</div>
            <p className="mt-2 text-base leading-7 text-slate-600">
              Base preparada para múltiples campañas, marcas y configuraciones.
            </p>

            <a
              href="/admin/campanias"
              className="mt-4 inline-flex rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-base font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Ver configuración
            </a>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-2xl font-semibold text-slate-900">Última actividad</h2>

          <div className="mt-4 space-y-3">
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              • Se creó o actualizó la campaña <span className="font-semibold">“Club Diez test”</span>.
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              • El comercio <span className="font-semibold">“Kiosco Centro”</span> quedó vinculado a una campaña.
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-base text-slate-700">
              • Se enviaron notificaciones a usuarios desde el portal del comercio.
            </div>
          </div>
        </div>


      </div>
    </div>
  );
}
