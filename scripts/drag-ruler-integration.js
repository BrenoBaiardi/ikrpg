Hooks.once('dragRuler.ready', (SpeedProvider) => {
    class IKRPGSpeedProvider extends SpeedProvider {
        get colors() {
            return [
                {
                    id: "normal",
                    default: 0x00FF00,
                    name: "Normal"
                },
                {
                    id: "penalty",
                    default: 0xFFB733,
                    name: "Atenção (Base a 2x)"
                },
                {
                    id: "prohibited",
                    default: 0xFF2222,
                    name: "Perigoso (Acima de 2x)"
                }
            ];
        }

        getRanges(token) {
            if (!token?.actor) return [];

            try {
                const currentMove = token.actor.system.derivedAttributes?.MOVE || 0;

                return [
                    {
                        range: currentMove,
                        color: "normal",
                    },
                    {
                        range: currentMove * 2,
                        color: "penalty",
                    },

                    {
                        range: currentMove * 3,
                        color: "prohibited",
                    }];
            } catch (e) {
                console.error("IKRPG - Erro no cálculo de movimento:", e);
                return [];
            }
        }
    }

    // Registro seguro
    if (typeof dragRuler !== 'undefined') {
        dragRuler.registerSystem('ikrpg', IKRPGSpeedProvider);
        console.log('IKRPG | Integração com Drag Ruler concluída');
    } else {
        console.warn('IKRPG | Drag Ruler não encontrado');
    }
});