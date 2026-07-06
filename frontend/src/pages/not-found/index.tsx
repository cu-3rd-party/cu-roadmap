import { RevealImage } from "@/shared/ui";

const NotFoundPage = () => {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-6 px-4 text-center">
      <RevealImage
        src="/character3.png"
        alt="Персонаж"
        aria-hidden
        className="pointer-events-none h-56 w-auto select-none object-contain sm:h-72"
      />
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold text-fg-primary sm:text-4xl">
          Ничего не найдено!
        </h1>
        <p className="text-base text-fg-secondary sm:text-lg">
          Похоже, ваша траектория привела вас куда-то не туда
        </p>
      </div>
    </div>
  );
};

export default NotFoundPage;
