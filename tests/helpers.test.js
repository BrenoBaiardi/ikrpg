describe('Exemplo de teste simples', () => {
    it('soma dois números corretamente', () => {
        const resultado = 2 + 3;
        expect(resultado).toBe(5);
    });

    it('verifica se uma string contém outra', () => {
        const texto = 'Foundry VTT é incrível';
        expect(texto).toMatch(/incrível/);
    });
});
