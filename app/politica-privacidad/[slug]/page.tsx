'use client'

import { use } from 'react'

const PROGRAMAS: Record<
  string,
  {
    nombre: string
    razonSocial: string
    cuit: string
    email: string
  }
> = {
  petrasol: {
    nombre: 'PETRASOL',
    razonSocial: 'PETRASOL SRL',
    cuit: '30-71013785-0',
    email: 'info@benefi.com.ar',
  },

  clubdiez: {
    nombre: 'CLUB DIEZ',
    razonSocial: 'SINERGIA S.R.L.',
    cuit: '30-71243563-8',
    email: 'info@benefi.com.ar',
  },

  laslomas: {
    nombre: 'LAS LOMAS',
    razonSocial: 'LAS LOMAS S.R.L.',
    cuit: '30-70715915-0',
    email: 'info@benefi.com.ar',
  },

  octano: {
    nombre: 'OCTANO',
    razonSocial: 'OCTANO SRL',
    cuit: '30-70848613-9',
    email: 'info@benefi.com.ar',
  },

  hiperunico: {
    nombre: 'HIPER ÚNICO',
    razonSocial: 'HECTOR MIGUEL BAMBINI S R L',
    cuit: '30-66847195-8',
    email: 'info@benefi.com.ar',
  },
}

export default function PoliticaPrivacidadPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = use(params)
  const programa = PROGRAMAS[slug.toLowerCase()]

  if (!programa) {
    return (
      <main className="min-h-screen bg-slate-50 px-4 py-12">
        <div className="mx-auto max-w-3xl rounded-2xl bg-white p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-950">
            Política de privacidad no encontrada
          </h1>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-8 sm:py-12">
      <article className="mx-auto w-full max-w-[1500px] rounded-2xl bg-white p-6 shadow-sm sm:p-10 lg:p-14">
        <header className="border-b border-slate-200 pb-6">
          <p className="text-base font-bold uppercase tracking-wider text-slate-500">
             {programa.nombre}
         </p>

          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-slate-950 sm:text-5xl">
            Política de Privacidad
         </h1>

          <p className="mt-3 text-sm text-slate-500">
            Última actualización: septiembre de 2026
          </p>
        </header>

        <div className="mt-10 space-y-10 text-lg leading-8 text-slate-700 sm:text-xl">
          <section>
            <h2 className="text-2xl font-bold text-slate-950">
            1. Introducción
            </h2>

            <p className="mt-3">
              La presente Política de Privacidad describe la forma en que se
              recopilan, utilizan, almacenan y protegen los datos personales de
              los usuarios de la aplicación móvil {programa.nombre} (en
              adelante, la “App”), correspondiente al programa de beneficios de{' '}
              <strong>{programa.razonSocial}</strong>, CUIT{' '}
              <strong>{programa.cuit}</strong>.
            </p>

            <p className="mt-3">
              {programa.razonSocial} se compromete a proteger la privacidad y
              los datos personales de los usuarios de la App y a tratarlos de
              acuerdo con la legislación aplicable, incluyendo la Ley N.º
              25.326 de Protección de los Datos Personales de la República
              Argentina.
            </p>

            <p className="mt-3">
              La utilización de la App implica el tratamiento de determinados
              datos necesarios para permitir el registro, identificación y
              autenticación de los usuarios, gestionar su participación en el
              programa de beneficios y brindar las funcionalidades y servicios
              disponibles.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              2. Responsable y contacto
            </h2>

            <div className="mt-3">
              <p>
                <strong>{programa.razonSocial}</strong>
              </p>
              <p>CUIT: {programa.cuit}</p>
              <p>
                Correo electrónico:{' '}
                <a
                  href={`mailto:${programa.email}`}
                  className="font-medium text-blue-600 underline"
                >
                  {programa.email}
                </a>
              </p>
            </div>

            <p className="mt-3">
              Los usuarios podrán utilizar este correo electrónico para
              realizar consultas relacionadas con la privacidad y el
              tratamiento de sus datos personales.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              3. Plataforma tecnológica
            </h2>

            <p className="mt-3">
              La App {programa.nombre} utiliza una plataforma tecnológica
              prestada y gestionada por <strong>SAVINGS S.A.</strong>, que
              interviene en el procesamiento y almacenamiento de la información
              necesaria para el funcionamiento de la App y del programa de
              beneficios, de acuerdo con las finalidades descriptas en esta
              Política de Privacidad.
            </p>

            <p className="mt-3">
              Los datos tratados a través de la plataforma serán utilizados
              para permitir el funcionamiento de la App y la prestación de sus
              servicios y funcionalidades.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              4. Datos que puede recopilar y tratar la App
            </h2>

            <p className="mt-3">
              Dependiendo de las funcionalidades utilizadas por el usuario, la
              App puede recopilar y tratar las siguientes categorías de
              información:
            </p>

            <div className="mt-4 space-y-4">
              <div>
                <h3 className="font-bold text-slate-900">
                  Datos de identificación
                </h3>
                <ul className="mt-2 list-disc pl-6">
                  <li>DNI.</li>
                  <li>Nombre y apellido.</li>
                  <li>Fecha de nacimiento.</li>
                  <li>Sexo/género.</li>
                </ul>

                <p className="mt-2">
                  La fecha de nacimiento y el dato de sexo/género pueden
                  obtenerse mediante el procesamiento de la información
                  contenida en el DNI del usuario.
                </p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Datos de contacto y perfil
                </h3>
                <ul className="mt-2 list-disc pl-6">
                  <li>Dirección de correo electrónico.</li>
                  <li>Número de teléfono celular.</li>
                  <li>Provincia.</li>
                  <li>Localidad.</li>
                  <li>Dirección.</li>
                  <li>Foto de perfil.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Datos de autenticación
                </h3>
                <ul className="mt-2 list-disc pl-6">
                  <li>
                    Contraseña y credenciales necesarias para la autenticación.
                  </li>
                  <li>
                    Tokens de sesión y otros identificadores técnicos
                    necesarios para mantener la sesión iniciada y proteger el
                    acceso a la cuenta.
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información relacionada con el programa de beneficios
                </h3>
                <ul className="mt-2 list-disc pl-6">
                  <li>Identificadores de tarjetas del programa.</li>
                  <li>Categoría y estado de la tarjeta.</li>
                  <li>Saldos.</li>
                  <li>Puntos y/o créditos.</li>
                  <li>Movimientos realizados.</li>
                  <li>Comercios relacionados con las operaciones.</li>
                  <li>Fechas e importes de las operaciones.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-bold text-slate-900">
                  Información obtenida mediante escaneo
                </h3>

                <p className="mt-2">
                  Cuando el usuario utiliza la funcionalidad de escaneo del DNI,
                  la información contenida en el código escaneado puede ser
                  enviada a los sistemas de la plataforma para su procesamiento
                  y para facilitar la identificación y registro del usuario.
                </p>

                <p className="mt-2">
                  La App también puede generar códigos QR asociados a la tarjeta
                  o cuenta del usuario para permitir su identificación dentro
                  del programa de beneficios.
                </p>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              5. Finalidad del tratamiento de los datos
            </h2>

            <p className="mt-3">
              Los datos personales recopilados a través de la App podrán
              utilizarse para:
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Crear y administrar la cuenta del usuario.</li>
              <li>Identificar y autenticar al usuario.</li>
              <li>Permitir el inicio y mantenimiento de sesión.</li>
              <li>Gestionar y actualizar el perfil.</li>
              <li>Recuperar o modificar las credenciales de acceso.</li>
              <li>
                Administrar la participación del usuario en el programa de
                beneficios {programa.nombre}.
              </li>
              <li>
                Gestionar tarjetas, categorías, puntos, créditos, saldos y
                movimientos.
              </li>
              <li>
                Identificar al usuario mediante códigos QR u otros mecanismos
                disponibles en la App.
              </li>
              <li>
                Enviar notificaciones relacionadas con la cuenta, el programa
                de beneficios, promociones, novedades o funcionalidades de la
                App.
              </li>
              <li>Brindar soporte y resolver inconvenientes técnicos.</li>
              <li>
                Mejorar el funcionamiento, rendimiento, estabilidad y seguridad
                de la App.
              </li>
              <li>
                Obtener información estadística y analítica sobre el
                funcionamiento y utilización de la aplicación.
              </li>
              <li>
                Cumplir obligaciones legales o requerimientos de autoridades
                competentes cuando corresponda.
              </li>
            </ul>

            <p className="mt-3">
              Los datos personales no serán utilizados para finalidades
              incompatibles con aquellas para las que fueron recopilados.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              6. Permisos y funcionalidades del dispositivo
            </h2>

            <h3 className="mt-3 font-bold text-slate-900">
              Cámara y fotografías
            </h3>
            <p className="mt-2">
              La App puede permitir al usuario tomar o seleccionar una
              fotografía para utilizarla como foto de perfil. También podrá
              utilizar la cámara cuando una funcionalidad requiera escanear
              códigos compatibles con la App.
            </p>

            <h3 className="mt-4 font-bold text-slate-900">
              Ubicación y mapas
            </h3>
            <p className="mt-2">
              La App integra servicios de mapas y ubicación de Google que
              pueden utilizarse en funcionalidades relacionadas con
              localización geográfica. Cuando corresponda, el acceso a la
              ubicación estará sujeto a los permisos otorgados por el usuario
              en su dispositivo.
            </p>

            <h3 className="mt-4 font-bold text-slate-900">Notificaciones</h3>
            <p className="mt-2">
              La App utiliza servicios de notificaciones para enviar
              comunicaciones relacionadas con el programa y sus
              funcionalidades. Para ello puede generarse y almacenarse un
              identificador o token de notificaciones asociado al dispositivo y
              a la cuenta del usuario.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              7. Servicios tecnológicos de terceros
            </h2>

            <p className="mt-3">
              Para brindar determinadas funcionalidades, mejorar el
              funcionamiento de la App y obtener información técnica sobre su
              utilización, la aplicación utiliza servicios tecnológicos de
              terceros.
            </p>

            <p className="mt-3">
              Entre ellos pueden encontrarse servicios provistos por Google y
              Firebase, incluyendo:
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Firebase Cloud Messaging.</li>
              <li>Firebase Analytics.</li>
              <li>Firebase Realtime Database.</li>
              <li>Firebase Authentication y otros componentes integrados.</li>
              <li>Google Maps y servicios de ubicación.</li>
            </ul>

            <p className="mt-3">
              Estos servicios pueden procesar información técnica,
              identificadores de la aplicación, información del dispositivo y
              otros datos necesarios para proporcionar sus funcionalidades.
            </p>

            <p className="mt-3">
              La utilización de estos servicios está sujeta también a las
              políticas y condiciones de privacidad de sus respectivos
              proveedores.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              8. Identificadores y datos técnicos
            </h2>

            <p className="mt-3">
              La App y los servicios tecnológicos integrados pueden generar o
              recopilar determinados identificadores técnicos necesarios para
              su funcionamiento.
            </p>

            <ul className="mt-3 list-disc space-y-1 pl-6">
              <li>Token utilizado para notificaciones push.</li>
              <li>Identificadores de instancia de la aplicación.</li>
              <li>
                Identificadores técnicos del dispositivo o de la instalación.
              </li>
              <li>Información técnica y de diagnóstico.</li>
              <li>
                Datos relacionados con errores o funcionamiento de la
                aplicación.
              </li>
              <li>Identificadores utilizados por servicios de análisis.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              9. Seguridad y confidencialidad
            </h2>

            <p className="mt-3">
              {programa.razonSocial} y SAVINGS S.A., dentro de sus respectivos
              ámbitos de actuación, adoptan medidas técnicas y organizativas
              destinadas a proteger la información personal frente a accesos no
              autorizados, pérdida, alteración, divulgación o tratamiento
              indebido.
            </p>

            <p className="mt-3">
              La información personal será tratada de manera confidencial y de
              acuerdo con la normativa aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              10. Comunicación y transferencia de información
            </h2>

            <p className="mt-3">
              Los datos personales no serán vendidos a terceros.
            </p>

            <p className="mt-3">
              La información podrá ser procesada por proveedores tecnológicos
              cuando resulte necesario para brindar las funcionalidades de la
              App, incluyendo los servicios tecnológicos mencionados en esta
              Política.
            </p>

            <p className="mt-3">
              Asimismo, determinada información podrá ser comunicada cuando
              exista una obligación legal, una orden judicial o un
              requerimiento válido de una autoridad competente.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              11. Conservación de los datos
            </h2>

            <p className="mt-3">
              Los datos personales serán conservados mientras la cuenta del
              usuario permanezca activa o durante el tiempo necesario para
              proporcionar las funcionalidades y servicios de la App.
            </p>

            <p className="mt-3">
              Cuando un usuario solicite la eliminación de su cuenta, se
              procederá a eliminar los datos personales asociados a ella, salvo
              aquella información que deba conservarse durante un período
              adicional por obligaciones legales, regulatorias, de seguridad,
              prevención del fraude, resolución de controversias u otras causas
              legítimas.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              12. Eliminación de cuenta y datos personales
            </h2>

            <p className="mt-3">
              El usuario puede solicitar en cualquier momento la eliminación de
              su cuenta {programa.nombre} y de los datos personales asociados a
              ella.
            </p>

            <p className="mt-3">
              La solicitud puede realizarse mediante el recurso web habilitado
              específicamente para {programa.nombre}:
            </p>

            <a
              href={`/baja-programa/${slug}`}
              className="mt-3 inline-block font-semibold text-blue-600 underline"
            >
              Solicitar eliminación de cuenta y datos
            </a>

            <p className="mt-3">
              Para identificar la cuenta cuya eliminación se solicita, podrá
              requerirse al usuario información que permita verificar su
              identidad.
            </p>

            <p className="mt-3">
              La eliminación de la cuenta implicará también la eliminación de
              los datos personales asociados, excepto aquellos que deban
              conservarse por alguna de las razones legítimas mencionadas en la
              sección anterior.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              13. Derechos de los usuarios
            </h2>

            <p className="mt-3">
              De acuerdo con la Ley N.º 25.326 de Protección de los Datos
              Personales, los usuarios podrán ejercer los derechos que
              correspondan respecto de sus datos personales, incluyendo
              solicitar acceso, rectificación, actualización o supresión de sus
              datos cuando corresponda.
            </p>

            <p className="mt-3">
              Para ejercer estos derechos o realizar consultas relacionadas con
              privacidad, el usuario podrá comunicarse a{' '}
              <a
                href={`mailto:${programa.email}`}
                className="font-medium text-blue-600 underline"
              >
                {programa.email}
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              14. Exactitud de la información
            </h2>

            <p className="mt-3">
              El usuario deberá proporcionar información verdadera, exacta y
              actualizada cuando resulte necesaria para utilizar las
              funcionalidades de la App.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-slate-950">
              15. Cambios en la Política de Privacidad
            </h2>

            <p className="mt-3">
              {programa.razonSocial} podrá actualizar la presente Política de
              Privacidad cuando resulte necesario debido a cambios en las
              funcionalidades de la App, en los servicios tecnológicos
              utilizados, en las prácticas de tratamiento de datos o en la
              normativa aplicable.
            </p>

            <p className="mt-3">
              La versión vigente estará disponible públicamente a través del
              enlace correspondiente a la App {programa.nombre}.
            </p>
          </section>

          <section className="border-t border-slate-200 pt-6">
            <h2 className="text-2xl font-bold text-slate-950">
              16. Contacto
            </h2>

            <div className="mt-3">
              <p>
                <strong>{programa.razonSocial}</strong>
              </p>
              <p>CUIT: {programa.cuit}</p>
              <p>
                Correo electrónico:{' '}
                <a
                  href={`mailto:${programa.email}`}
                  className="font-medium text-blue-600 underline"
                >
                  {programa.email}
                </a>
              </p>
            </div>
          </section>
        </div>
      </article>
    </main>
  )
}