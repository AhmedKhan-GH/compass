library ieee;
use ieee.std_logic_1164.all;

entity top_module is
    port (
        critical : in std_logic;
        warning : in std_logic;
        advisory : in std_logic;
        code : out std_logic_vector(1 downto 0);
        valid : out std_logic
    );
end entity;

architecture rtl of top_module is
begin
    code <= "11" when critical = '1' else "10" when warning = '1' else "01" when advisory = '1' else "00";
    valid <= critical or warning or advisory;
end architecture;
