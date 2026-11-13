library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        digit : in std_logic_vector(3 downto 0);
        segments : out std_logic_vector(6 downto 0);
        valid : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    process(all) begin valid <= '1'; case digit is when x"0"=>segments<="1111110"; when x"1"=>segments<="0110000"; when x"2"=>segments<="1101101"; when x"3"=>segments<="1111001"; when x"4"=>segments<="0110011"; when x"5"=>segments<="1011011"; when x"6"=>segments<="1011111"; when x"7"=>segments<="1110000"; when x"8"=>segments<="1111111"; when x"9"=>segments<="1111011"; when others=>segments<=(others=>'0'); valid<='0'; end case; end process;
end architecture;
